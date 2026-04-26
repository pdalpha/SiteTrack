/**
 * server/payments.ts
 * Payment gateway helpers for Razorpay (India) and Stripe (International).
 *
 * Environment variables required:
 *   RAZORPAY_KEY_ID          — Razorpay API Key ID
 *   RAZORPAY_KEY_SECRET      — Razorpay API Key Secret
 *   RAZORPAY_WEBHOOK_SECRET  — Razorpay webhook signature secret
 *   STRIPE_SECRET_KEY        — Stripe Secret Key
 *   STRIPE_WEBHOOK_SECRET    — Stripe webhook endpoint secret
 *   APP_URL                  — Public base URL (e.g. https://sitetrack.onrender.com)
 */

import crypto from "crypto";

// ─── Razorpay ─────────────────────────────────────────────────────────────────

interface RazorpaySubscriptionResponse {
  id: string;
  short_url: string;
  status: string;
}

/**
 * Create a Razorpay subscription.
 * Returns the subscription ID and a short URL for the hosted payment page.
 */
export async function createRazorpaySubscription(opts: {
  planId: string;
  totalCount: number; // number of billing cycles (e.g. 12 for yearly auto-renew)
  quantity?: number;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  notes?: Record<string, string>;
}): Promise<RazorpaySubscriptionResponse> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  const payload = {
    plan_id: opts.planId,
    total_count: opts.totalCount,
    quantity: opts.quantity ?? 1,
    customer_notify: 1,
    ...(opts.customerName || opts.customerEmail || opts.customerContact
      ? {
          customer_notify: 1,
          notify_info: {
            notify_phone: opts.customerContact,
            notify_email: opts.customerEmail,
          },
        }
      : {}),
    notes: opts.notes ?? {},
  };

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Razorpay subscription creation failed: ${error}`);
  }

  return res.json() as Promise<RazorpaySubscriptionResponse>;
}

/**
 * Cancel a Razorpay subscription.
 * cancelAtCycleEnd = true means it cancels after the current billing cycle.
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd = true
): Promise<void> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured.");
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Razorpay cancel failed: ${error}`);
  }
}

/**
 * Verify a Razorpay webhook signature.
 * Returns true if the signature is valid.
 */
export function verifyRazorpayWebhook(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET not set.");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

import Stripe from "stripe";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured.");
  return new Stripe(key, { apiVersion: "2025-04-30.basil" });
}

/**
 * Create a Stripe Checkout Session for a subscription.
 * Returns the session URL to redirect the user to.
 */
export async function createStripeCheckoutSession(opts: {
  priceId: string;
  userId: number;
  userEmail: string;
  planCode: string;
  billingInterval: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const appUrl = process.env.APP_URL || "https://sitetrack.onrender.com";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: opts.priceId, quantity: 1 }],
    customer_email: opts.userEmail,
    client_reference_id: String(opts.userId),
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        userId: String(opts.userId),
        planCode: opts.planCode,
        billingInterval: opts.billingInterval,
      },
    },
    metadata: {
      userId: String(opts.userId),
      planCode: opts.planCode,
      billingInterval: opts.billingInterval,
    },
    success_url: opts.successUrl || `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: opts.cancelUrl || `${appUrl}/pricing`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");

  return { sessionId: session.id, url: session.url };
}

/**
 * Cancel a Stripe subscription (at period end by default).
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediately = false
): Promise<void> {
  const stripe = getStripe();
  if (immediately) {
    await stripe.subscriptions.cancel(subscriptionId);
  } else {
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  }
}

/**
 * Construct and verify a Stripe webhook event from the raw body.
 */
export function constructStripeEvent(rawBody: Buffer | string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set.");
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
