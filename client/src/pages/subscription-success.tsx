import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  free_trial: "Free Trial",
};

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: subscription } = useSubscription();

  // Refresh subscription data in the background
  useEffect(() => {
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
    }, 2000);
    return () => clearTimeout(timer);
  }, [queryClient]);

  const planName = subscription
    ? PLAN_LABELS[subscription.planCode] || subscription.planCode
    : "your new plan";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful! 🎉</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              You're now subscribed to the
            </p>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-semibold px-4 py-2 rounded-full">
              <Crown className="w-4 h-4" />
              {planName} Plan
            </div>
          </div>

          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Your subscription renews on{" "}
              <strong>
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </strong>
            </p>
          )}

          <div className="rounded-lg bg-muted/50 p-4 text-sm text-left space-y-2">
            <p className="font-medium text-foreground">What's next?</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                All premium features are now unlocked
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                A receipt has been sent to your email
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                Manage billing from your profile settings
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/")} className="w-full gap-2">
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/pricing")} className="w-full">
              View Plan Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
