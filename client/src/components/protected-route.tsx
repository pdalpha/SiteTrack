import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Redirect, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Zap, Clock, CheckCircle2 } from "lucide-react";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

function TrialExpiredWall() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-destructive/20">
        <CardContent className="pt-10 pb-10 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Your 14-day free trial has ended</h2>
            <p className="text-muted-foreground">
              Upgrade to keep full access to all your sites, workers, and data. Your information is safe and will be restored immediately after you upgrade.
            </p>
          </div>

          {/* Data reassurance */}
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-500/10 rounded-lg px-4 py-3 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>✅ All your data is preserved — nothing has been deleted</span>
          </div>

          {/* Benefits of upgrading */}
          <div className="bg-muted/50 rounded-lg px-4 py-3 space-y-1">
            <p className="text-sm font-medium text-foreground mb-2">What you get with a paid plan:</p>
            {["Continue tracking all your sites & workers", "Access attendance, expenses & DPR history", "Export reports & GST invoices", "Priority support from our team"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/pricing")}
              className="w-full gap-2 py-6 text-base font-semibold"
            >
              <Zap className="w-5 h-5 fill-current" />
              View Plans & Upgrade
            </Button>
            <p className="text-xs text-muted-foreground">
              Plans start at ₹999/month · Yearly plans save 2 months free · Cancel anytime
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();

  if (authLoading || subLoading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Check if trial has expired
  if (subscription) {
    const isTrialing = subscription.status === "trialing";
    const isExpired = subscription.status === "expired";
    const trialOver =
      isTrialing &&
      subscription.currentPeriodEnd &&
      new Date(subscription.currentPeriodEnd) < new Date();

    if (isExpired || trialOver) {
      return <TrialExpiredWall />;
    }
  }

  return <Component />;
}
