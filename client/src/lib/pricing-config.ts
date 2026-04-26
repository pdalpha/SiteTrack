/**
 * SiteTrack Pricing Configuration
 *
 * This is the single source of truth for all plan data.
 * When Razorpay integration is ready:
 *   1. Fill in `razorpayPlanId` from your Razorpay dashboard
 *   2. Use `planCode` as the internal identifier in your subscriptions table
 *   3. `billingInterval` drives the checkout payload: { period: "monthly" | "yearly", interval: 1 }
 *   4. `featureLimits` can be enforced server-side via a middleware checking the user's active plan
 */

export type BillingInterval = "monthly" | "yearly";
export type PlanCode = "free_trial" | "starter" | "pro" | "business";

export interface PlanFeatureLimit {
  maxSites: number | "unlimited";
  maxAdminUsers: number | "unlimited";
  maxWorkersTracked: number | "unlimited";
  storageGB: number | "unlimited";
}

export interface PricingPlan {
  /** Internal identifier — maps to subscriptions.plan_code in the DB */
  planCode: PlanCode;
  /** Display name */
  name: string;
  /** Short tagline shown under the plan name */
  tagline: string;
  /** Who this plan is designed for */
  audience: string;
  /** Monthly price in INR. null = contact sales / custom */
  monthlyPrice: number | null;
  /** Yearly price in INR (total for the year, already discounted). null = same as monthly × 12 */
  yearlyPrice: number | null;
  /** Razorpay Plan IDs — fill in after creating plans in Razorpay dashboard */
  razorpayPlanId: {
    monthly: string | null;
    yearly: string | null;
  };
  /**
   * Stripe Price IDs — fill in after creating prices in Stripe dashboard.
   * Used for international customers paying in USD.
   */
  stripePriceId: {
    monthly: string | null;
    yearly: string | null;
  };
  /** Trial duration in days. 0 = no trial */
  trialDays: number;
  /** CTA button label */
  cta: string;
  /** Secondary CTA for the comparison table */
  ctaShort: string;
  /** Highlight as recommended */
  recommended: boolean;
  /** Feature limits enforced server-side */
  featureLimits: PlanFeatureLimit;
  /** Feature list shown on the card (human-readable) */
  features: string[];
  /** Features NOT included (shown greyed out in comparison) */
  notIncluded: string[];
}

export const PLANS: PricingPlan[] = [
  {
    planCode: "free_trial",
    name: "Free Trial",
    tagline: "Try everything, risk-free",
    audience: "For contractors who want to evaluate SiteTrack before committing.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    razorpayPlanId: { monthly: null, yearly: null }, // No charge — no plan ID needed
    stripePriceId: { monthly: null, yearly: null }, // Free plan — no Stripe price needed
    trialDays: 14,
    cta: "Start Free Trial",
    ctaShort: "Start Free",
    recommended: false,
    featureLimits: {
      maxSites: 1,
      maxAdminUsers: 1,
      maxWorkersTracked: 15,
      storageGB: 1,
    },
    features: [
      "1 active site",
      "Up to 15 workers",
      "Attendance tracking",
      "Daily Progress Reports (DPR)",
      "Expense tracking",
      "Basic dashboard",
      "14-day full access",
      "Email support",
    ],
    notIncluded: [
      "Photo uploads",
      "CSV / report export",
      "Bulk attendance actions",
      "Multiple sites",
      "Priority support",
    ],
  },
  {
    planCode: "starter",
    name: "Starter",
    tagline: "For one active site",
    audience: "For small contractors running a single site who need clean digital records.",
    monthlyPrice: 999,
    yearlyPrice: 9990, // ~2 months free
    razorpayPlanId: {
      monthly: null, // e.g. "plan_xxxxxxxxxxxxxxx"
      yearly: null,  // e.g. "plan_xxxxxxxxxxxxxxx"
    },
    stripePriceId: {
      monthly: null, // e.g. "price_xxxxxxxxxxxxxxxxxx"
      yearly: null,  // e.g. "price_xxxxxxxxxxxxxxxxxx"
    },
    trialDays: 14,
    cta: "Choose Starter",
    ctaShort: "Starter",
    recommended: false,
    featureLimits: {
      maxSites: 1,
      maxAdminUsers: 2,
      maxWorkersTracked: 50,
      storageGB: 5,
    },
    features: [
      "1 active site",
      "Up to 2 admin/supervisor users",
      "Up to 50 workers tracked",
      "Attendance tracking",
      "Expense tracking",
      "Basic dashboard & KPIs",
      "5 GB photo storage",
      "Email support",
    ],
    notIncluded: [
      "Daily Progress Reports (DPR)",
      "CSV / report export",
      "Bulk attendance actions",
      "Multiple sites",
      "Priority support",
    ],
  },
  {
    planCode: "pro",
    name: "Pro",
    tagline: "For growing teams and active sites",
    audience: "For contractors managing multiple sites, supervisors, and needing full reporting.",
    monthlyPrice: 2499,
    yearlyPrice: 24990, // ~2 months free
    razorpayPlanId: {
      monthly: null, // e.g. "plan_xxxxxxxxxxxxxxx"
      yearly: null,  // e.g. "plan_xxxxxxxxxxxxxxx"
    },
    stripePriceId: {
      monthly: null, // e.g. "price_xxxxxxxxxxxxxxxxxx"
      yearly: null,  // e.g. "price_xxxxxxxxxxxxxxxxxx"
    },
    trialDays: 14,
    cta: "Choose Pro",
    ctaShort: "Pro",
    recommended: true,
    featureLimits: {
      maxSites: 5,
      maxAdminUsers: 5,
      maxWorkersTracked: 200,
      storageGB: 25,
    },
    features: [
      "Up to 5 active sites",
      "Up to 5 admin/supervisor users",
      "Up to 200 workers tracked",
      "Attendance tracking + bulk actions",
      "Daily Progress Reports (DPR)",
      "Expense tracking with bill photos",
      "Attendance & expense reports",
      "CSV export for all reports",
      "25 GB photo storage",
      "Priority email support",
    ],
    notIncluded: [
      "Unlimited sites",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
  {
    planCode: "business",
    name: "Business",
    tagline: "For contractors running multiple sites",
    audience: "For established firms managing large teams, multiple projects, and complex reporting.",
    monthlyPrice: 4999,
    yearlyPrice: 49990, // ~2 months free
    razorpayPlanId: {
      monthly: null, // e.g. "plan_xxxxxxxxxxxxxxx"
      yearly: null,  // e.g. "plan_xxxxxxxxxxxxxxx"
    },
    stripePriceId: {
      monthly: null, // e.g. "price_xxxxxxxxxxxxxxxxxx"
      yearly: null,  // e.g. "price_xxxxxxxxxxxxxxxxxx"
    },
    trialDays: 14,
    cta: "Contact Sales",
    ctaShort: "Business",
    recommended: false,
    featureLimits: {
      maxSites: "unlimited",
      maxAdminUsers: "unlimited",
      maxWorkersTracked: "unlimited",
      storageGB: "unlimited",
    },
    features: [
      "Unlimited active sites",
      "Unlimited admin/supervisor users",
      "Unlimited workers tracked",
      "All Pro features included",
      "Multi-site operations & switching",
      "Advanced dashboard across all sites",
      "Unlimited photo storage",
      "GST-compliant invoices",
      "Dedicated account manager",
      "Phone + priority support",
    ],
    notIncluded: [],
  },
];

/**
 * Comparison table rows — defines which features appear in the
 * full feature comparison matrix below the plan cards.
 */
export interface ComparisonFeature {
  label: string;
  category: string;
  getValue: (plan: PricingPlan) => string | boolean;
}

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  // Capacity
  { label: "Active sites", category: "Capacity", getValue: (p) => String(p.featureLimits.maxSites) },
  { label: "Admin/supervisor users", category: "Capacity", getValue: (p) => String(p.featureLimits.maxAdminUsers) },
  { label: "Workers tracked", category: "Capacity", getValue: (p) => String(p.featureLimits.maxWorkersTracked) },
  { label: "Photo storage", category: "Capacity", getValue: (p) => p.featureLimits.storageGB === "unlimited" ? "Unlimited" : `${p.featureLimits.storageGB} GB` },
  // Core features
  { label: "Attendance tracking", category: "Features", getValue: () => true },
  { label: "Bulk mark present / absent", category: "Features", getValue: (p) => p.planCode !== "starter" && p.planCode !== "free_trial" },
  { label: "Expense tracking", category: "Features", getValue: () => true },
  { label: "Bill photo uploads", category: "Features", getValue: (p) => p.planCode !== "free_trial" },
  { label: "Daily Progress Reports", category: "Features", getValue: (p) => p.planCode !== "starter" },
  { label: "Attendance & expense reports", category: "Features", getValue: (p) => p.planCode === "pro" || p.planCode === "business" },
  { label: "CSV export", category: "Features", getValue: (p) => p.planCode === "pro" || p.planCode === "business" },
  // Support
  { label: "Email support", category: "Support", getValue: () => true },
  { label: "Priority email support", category: "Support", getValue: (p) => p.planCode === "pro" || p.planCode === "business" },
  { label: "Dedicated account manager", category: "Support", getValue: (p) => p.planCode === "business" },
  { label: "GST-compliant invoices", category: "Support", getValue: (p) => p.planCode === "business" },
];

export const PRICING_FAQ = [
  {
    q: "Is there a free trial?",
    a: "Yes. You get 14 days of full access on any plan — no credit card required. After the trial, choose a plan that fits your business or your account will move to read-only mode.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, you can cancel your subscription at any time from your account settings. You'll retain access until the end of your current billing period. No cancellation fees.",
  },
  {
    q: "Do I pay per worker or per laborer?",
    a: "No. SiteTrack charges per admin/supervisor user — the people who log in and manage the app. Workers are tracked as records, not as paid seats. You can track hundreds of laborers on a single paid account.",
  },
  {
    q: "Can I add more sites later?",
    a: "Yes. You can upgrade your plan at any time to unlock more sites. Upgrading takes effect immediately and your billing adjusts on a prorated basis.",
  },
  {
    q: "Do you provide GST-compliant invoices?",
    a: "GST-compliant invoices are available on the Business plan. If you need an invoice urgently on another plan, contact our support team and we'll help you out.",
  },
  {
    q: "How does billing work?",
    a: "Billing is monthly or yearly depending on the cycle you choose. Payments are processed securely through Razorpay. You'll receive an email receipt after every successful payment.",
  },
  {
    q: "What happens if I exceed my site or user limit?",
    a: "You'll be notified when you're close to your limit. You won't lose any data — you just won't be able to add new sites or users until you upgrade. Existing data is always safe.",
  },
  {
    q: "Can multiple supervisors use the same account?",
    a: "Yes. Each plan includes a defined number of admin/supervisor seats. Each supervisor gets their own login. Workers on site don't need a login — they're tracked by the supervisors.",
  },
];
