import { ReactNode } from "react";
import { useSubscription, useIsSubscriptionActive } from "@/hooks/use-subscription";
import { PLANS, PlanCode } from "@/lib/pricing-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Lock, Zap } from "lucide-react";

interface SubscriptionGuardProps {
  children: ReactNode;
  requiredPlan?: PlanCode;
  fallback?: ReactNode;
}

/**
 * SubscriptionGuard
 * Wraps content that requires an active subscription or a specific plan.
 * If the user doesn't meet the requirement, shows a beautiful upgrade prompt.
 */
export function SubscriptionGuard({ children, requiredPlan, fallback }: SubscriptionGuardProps) {
  const { data: subscription, isLoading } = useSubscription();
  const isActive = useIsSubscriptionActive(subscription);
  const [, navigate] = useLocation();

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Checking subscription...</div>;
  }

  // Determine if current plan meets the required plan level
  const planOrder: PlanCode[] = ["free_trial", "starter", "pro", "business"];
  const currentPlanIndex = planOrder.indexOf(subscription?.planCode || "free_trial");
  const requiredPlanIndex = requiredPlan ? planOrder.indexOf(requiredPlan) : 0;
  
  const meetsPlanRequirement = currentPlanIndex >= requiredPlanIndex;

  if (isActive && meetsPlanRequirement) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const requiredPlanName = requiredPlan ? PLANS.find(p => p.planCode === requiredPlan)?.name : "a premium plan";

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto border-dashed border-2 bg-muted/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Premium Feature</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {!isActive 
              ? "Your subscription has expired. Please renew to continue using this feature."
              : `This feature requires the ${requiredPlanName}. Your current plan (${PLANS.find(p => p.planCode === (subscription?.planCode || "free_trial"))?.name}) doesn't include this.`
            }
          </p>
          <Button onClick={() => navigate("/pricing")} className="gap-2">
            <Zap className="w-4 h-4 fill-current" />
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
