import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  PLANS,
  COMPARISON_FEATURES,
  PRICING_FAQ,
  type PricingPlan,
  type BillingInterval,
} from "@/lib/pricing-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  X,
  Minus,
  HardHat,
  Zap,
  Building2,
  PhoneCall,
  ArrowRight,
  Star,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number | null, interval: BillingInterval): string {
  if (price === null) return "Custom";
  if (price === 0) return "Free";
  const monthly = interval === "yearly" ? Math.round(price / 12) : price;
  return `₹${monthly.toLocaleString("en-IN")}`;
}

function getYearlySaving(plan: PricingPlan): number | null {
  if (!plan.monthlyPrice || !plan.yearlyPrice) return null;
  const monthlyCost = plan.monthlyPrice * 12;
  return monthlyCost - plan.yearlyPrice;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free_trial: <Zap className="w-5 h-5" />,
  starter: <HardHat className="w-5 h-5" />,
  pro: <Star className="w-5 h-5" />,
  business: <Building2 className="w-5 h-5" />,
};

// ─── CTA Action ──────────────────────────────────────────────────────────────
/**
 * RAZORPAY INTEGRATION HOOK
 * When ready, replace this function with the actual Razorpay checkout flow:
 *
 * 1. Call your backend: POST /api/subscriptions/create-checkout
 *    Body: { planCode, billingInterval }
 * 2. Backend creates a Razorpay subscription and returns { subscriptionId, shortUrl }
 * 3. Open Razorpay hosted page: window.open(shortUrl) or use Razorpay.js checkout
 * 4. On success webhook (razorpay.subscription.activated), update user's plan in DB
 */
function usePlanCTA(plan: PricingPlan, billingInterval: BillingInterval) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Detect likely payment gateway based on timezone.
   * Indian users (Asia/Kolkata) → Razorpay
   * Everyone else → Stripe
   */
  const isIndianUser = (): boolean => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Calcutta" ||
        Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Kolkata";
    } catch {
      return true; // Default to Razorpay if detection fails
    }
  };

  return { isLoading, handleCTA: async () => {
    if (plan.planCode === "business") {
      window.open("mailto:sales@sitetrack.app?subject=SiteTrack Business Plan Inquiry", "_blank");
      return;
    }

    if (!isAuthenticated) {
      navigate(`/login?plan=${plan.planCode}&interval=${billingInterval}`);
      return;
    }

    if (plan.planCode === "free_trial") {
      toast({
        title: "You already have access",
        description: "You're currently on a free trial. Choose a paid plan to continue after your trial ends.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const useRazorpay = isIndianUser();

      if (useRazorpay) {
        // ── Razorpay Flow ──
        const planId = billingInterval === "yearly"
          ? plan.razorpayPlanId.yearly
          : plan.razorpayPlanId.monthly;

        if (!planId) {
          toast({
            title: "Coming soon",
            description: "Payment integration is being set up. Please contact support to upgrade.",
          });
          return;
        }

        const res = await fetch("/api/subscriptions/razorpay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ planId, planCode: plan.planCode, billingInterval }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create subscription");

        // Redirect to Razorpay hosted payment page
        window.location.href = data.shortUrl;

      } else {
        // ── Stripe Flow ──
        const priceId = billingInterval === "yearly"
          ? plan.stripePriceId.yearly
          : plan.stripePriceId.monthly;

        if (!priceId) {
          toast({
            title: "Coming soon",
            description: "International payment integration is being set up. Please contact support.",
          });
          return;
        }

        const res = await fetch("/api/subscriptions/stripe/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ priceId, planCode: plan.planCode, billingInterval }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create checkout session");

        // Redirect to Stripe Checkout hosted page
        window.location.href = data.url;
      }
    } catch (e: any) {
      toast({ title: "Payment error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }};
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  billingInterval,
}: {
  plan: PricingPlan;
  billingInterval: BillingInterval;
}) {
  const { isLoading, handleCTA } = usePlanCTA(plan, billingInterval);
  const saving = getYearlySaving(plan);
  const isYearly = billingInterval === "yearly";
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-card transition-shadow ${
        plan.recommended
          ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
          : "border-border shadow-sm hover:shadow-md"
      }`}
    >
      {/* Recommended badge */}
      {plan.recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold tracking-wide rounded-full shadow-sm">
            Recommended for most teams
          </Badge>
        </div>
      )}

      {/* Plan header */}
      <CardHeader className="p-8 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            {PLAN_ICONS[plan.planCode]}
          </div>
          {isYearly && saving && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 font-medium">
              Save ₹{saving.toLocaleString("en-IN")}
            </Badge>
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{plan.tagline}</p>
        </div>
      </CardHeader>

      <CardContent className="p-8 flex-1 flex flex-col">
        {/* Pricing */}
        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">
              {formatPrice(price, billingInterval)}
            </span>
            {price !== null && price !== 0 && (
              <span className="text-muted-foreground font-medium">
                /{isYearly ? "year" : "month"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {plan.audience}
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleCTA}
          disabled={isLoading}
          className={`w-full gap-2 text-sm font-semibold py-6 rounded-xl transition-all duration-300 mb-8 ${
            plan.recommended
              ? "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
              : "variant-outline border-primary/20 text-primary hover:bg-primary/5"
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {plan.planCode === "business" ? (
                <>
                  <PhoneCall className="w-4 h-4" />
                  {plan.cta}
                </>
              ) : (
                <>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </>
          )}
        </Button>

        {/* Features list */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              What's included
            </p>
            <ul className="space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {plan.notIncluded.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Not included
              </p>
              <ul className="space-y-3">
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground/60">
                    <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}

// ─── CTAButton (hook-safe wrapper for use in maps) ────────────────────────────
function CTAButton({
  plan,
  billingInterval,
  size,
  className,
}: {
  plan: PricingPlan;
  billingInterval: BillingInterval;
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}) {
  const handleCTA = usePlanCTA(plan, billingInterval);
  return (
    <Button
      onClick={handleCTA}
      variant={plan.recommended ? "default" : "outline"}
      size={size}
      className={className}
      data-testid={`button-compare-cta-${plan.planCode}`}
    >
      {plan.ctaShort}
    </Button>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────
function ComparisonTable({ billingInterval }: { billingInterval: BillingInterval }) {
  const categories = Array.from(new Set(COMPARISON_FEATURES.map((f) => f.category)));

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left py-4 px-5 font-semibold w-[36%]">Feature</th>
            {PLANS.map((plan) => (
              <th key={plan.planCode} className="py-4 px-3 text-center font-semibold min-w-[110px]">
                <div className="flex flex-col items-center gap-1">
                  <span>{plan.name}</span>
                  {plan.recommended && (
                    <Badge className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-primary/20">
                      Best value
                    </Badge>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Price row */}
          <tr className="border-b bg-muted/20">
            <td className="py-3.5 px-5 text-muted-foreground font-medium">Monthly price</td>
            {PLANS.map((plan) => (
              <td key={plan.planCode} className="py-3.5 px-3 text-center font-semibold tabular-nums">
                {plan.monthlyPrice === 0
                  ? "Free"
                  : plan.monthlyPrice
                  ? `₹${(billingInterval === "yearly"
                      ? Math.round((plan.yearlyPrice ?? plan.monthlyPrice * 12) / 12)
                      : plan.monthlyPrice
                    ).toLocaleString("en-IN")}`
                  : "Custom"}
              </td>
            ))}
          </tr>

          {/* Feature rows grouped by category */}
          {categories.map((cat) => (
            <>
              <tr key={`cat-${cat}`} className="bg-muted/30">
                <td
                  colSpan={PLANS.length + 1}
                  className="py-2 px-5 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {cat}
                </td>
              </tr>
              {COMPARISON_FEATURES.filter((f) => f.category === cat).map((feature) => (
                <tr key={feature.label} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-5 text-sm">{feature.label}</td>
                  {PLANS.map((plan) => {
                    const val = feature.getValue(plan);
                    return (
                      <td key={plan.planCode} className="py-3 px-3 text-center">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className={`w-4 h-4 mx-auto ${plan.recommended ? "text-primary" : "text-green-600 dark:text-green-500"}`} />
                          ) : (
                            <Minus className="w-4 h-4 mx-auto text-muted-foreground/40" />
                          )
                        ) : (
                          <span className={`font-medium tabular-nums ${val === "unlimited" ? (plan.recommended ? "text-primary" : "") : ""}`}>
                            {val === "unlimited" ? "Unlimited" : val}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </>
          ))}

          {/* CTA row */}
          <tr className="bg-muted/20">
            <td className="py-4 px-5 text-muted-foreground text-sm font-medium">Get started</td>
            {PLANS.map((plan) => (
              <td key={plan.planCode} className="py-4 px-3 text-center">
                <CTAButton plan={plan} billingInterval={billingInterval} size="sm" className="w-full max-w-[110px]" />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQSection() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Have a question not listed here?{" "}
          <a
            href="mailto:support@sitetrack.app"
            className="text-primary underline-offset-4 hover:underline"
          >
            Email us
          </a>
        </p>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {PRICING_FAQ.map((item, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border rounded-xl px-4 bg-card shadow-sm data-[state=open]:shadow-md transition-shadow"
          >
            <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-full pb-20">
      {/* ── Hero ── */}
      <section className="px-4 pt-10 pb-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary border border-primary/15 rounded-full px-4 py-1.5 text-xs font-medium mb-5">
          <HardHat className="w-3.5 h-3.5" />
          Simple, transparent pricing
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          Manage your sites better.
          <br />
          <span className="text-primary">Pay only for what you need.</span>
        </h1>
        <p className="mt-4 text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
          SiteTrack is priced per admin or supervisor seat — not per laborer. Track
          hundreds of workers with a single affordable subscription.
        </p>

        {/* Billing toggle */}
        <div className="mt-6 inline-flex items-center gap-1 bg-muted rounded-full p-1 text-sm">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={`px-5 py-1.5 rounded-full font-medium transition-colors ${
              billingInterval === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="toggle-monthly"
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("yearly")}
            className={`px-5 py-1.5 rounded-full font-medium transition-colors flex items-center gap-2 ${
              billingInterval === "yearly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="toggle-yearly"
          >
            Yearly
            <span className="text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded-full">
              Save ~17%
            </span>
          </button>
        </div>

        {isAuthenticated && (
          <div className="mt-4 text-sm text-muted-foreground">
            <span className="bg-muted px-3 py-1 rounded-full">
              You're currently on a trial. Upgrade anytime to keep your data and access.
            </span>
          </div>
        )}
      </section>

      {/* ── Plan Cards ── */}
      <section className="px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-2">
          {PLANS.map((plan) => (
            <PlanCard key={plan.planCode} plan={plan} billingInterval={billingInterval} />
          ))}
        </div>

        {/* Trust note */}
        <p className="text-center text-xs text-muted-foreground mt-5 flex items-center justify-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-green-600" />
          14-day free trial on all paid plans · No credit card required · Cancel anytime
        </p>
      </section>

      {/* ── Feature Comparison ── */}
      <section className="px-4 max-w-7xl mx-auto mt-16">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold">Compare plans in detail</h2>
          <p className="text-sm text-muted-foreground mt-1">
            See exactly what each plan includes before choosing.
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <ComparisonTable billingInterval={billingInterval} />
        </div>

        {/* Mobile: stacked per-plan blocks */}
        <div className="md:hidden space-y-4">
          {PLANS.map((plan) => (
            <Card key={plan.planCode} className={plan.recommended ? "border-primary ring-1 ring-primary/20" : ""}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{plan.name}</div>
                  {plan.recommended && (
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-bold tabular-nums">
                  {plan.monthlyPrice === 0
                    ? "Free"
                    : `₹${(billingInterval === "yearly" && plan.yearlyPrice
                        ? Math.round(plan.yearlyPrice / 12)
                        : plan.monthlyPrice ?? 0
                      ).toLocaleString("en-IN")}/mo`}
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {COMPARISON_FEATURES.map((feature) => {
                  const val = feature.getValue(plan);
                  return (
                    <div key={feature.label} className="flex items-center justify-between text-sm py-1 border-b last:border-b-0">
                      <span className="text-muted-foreground">{feature.label}</span>
                      {typeof val === "boolean" ? (
                        val ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground/40" />
                        )
                      ) : (
                        <span className="font-medium tabular-nums text-right">
                          {val === "unlimited" ? "Unlimited" : val}
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="px-4 max-w-4xl mx-auto mt-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Check className="w-5 h-5 text-primary" />, label: "No per-worker fees" },
            { icon: <Check className="w-5 h-5 text-primary" />, label: "Cancel anytime" },
            { icon: <Check className="w-5 h-5 text-primary" />, label: "Secure payments via Razorpay" },
            { icon: <Check className="w-5 h-5 text-primary" />, label: "Your data, always safe" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3 text-sm font-medium"
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 max-w-7xl mx-auto mt-16">
        <FAQSection />
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-4 max-w-3xl mx-auto mt-16">
        <div className="rounded-2xl bg-primary/5 border border-primary/15 p-8 md:p-10 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Ready to get your sites in order?
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-lg mx-auto leading-relaxed">
            Start with a 14-day free trial. No credit card needed. Set up your first
            site in under 5 minutes and see the difference SiteTrack makes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => {
                const freePlan = PLANS.find((p) => p.planCode === "free_trial");
                if (freePlan) {
                  const el = document.querySelector(`[data-testid="button-plan-cta-free_trial"]`);
                  (el as HTMLButtonElement)?.click();
                }
              }}
              data-testid="button-bottom-free-trial"
            >
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                window.open("mailto:sales@sitetrack.app?subject=SiteTrack Demo Request", "_blank")
              }
              data-testid="button-bottom-contact-sales"
            >
              <PhoneCall className="w-4 h-4 mr-2" />
              Talk to sales
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Questions? Email us at{" "}
            <a href="mailto:support@sitetrack.app" className="underline underline-offset-4">
              support@sitetrack.app
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
