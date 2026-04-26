import { useLocation } from "wouter";
import { useSubscription, useDaysLeft } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { X, Zap, Clock } from "lucide-react";
import { useState } from "react";

export function TrialBanner() {
  const { data: subscription } = useSubscription();
  const daysLeft = useDaysLeft(subscription);
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Only show for trialing users
  if (dismissed) return null;
  if (!subscription || subscription.status !== "trialing") return null;
  if (daysLeft === null) return null;

  const isUrgent = daysLeft <= 3;
  const isWarning = daysLeft <= 7;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium transition-colors ${
        isUrgent
          ? "bg-destructive/10 text-destructive border-b border-destructive/20"
          : isWarning
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-b border-amber-500/20"
          : "bg-primary/10 text-primary border-b border-primary/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0" />
        <span>
          {daysLeft === 0
            ? "Your free trial ends today!"
            : daysLeft === 1
            ? "Your free trial ends tomorrow!"
            : `Your free trial ends in ${daysLeft} days.`}{" "}
          Upgrade to keep full access.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant={isUrgent ? "destructive" : "default"}
          className="h-7 px-3 text-xs gap-1"
          onClick={() => navigate("/pricing")}
        >
          <Zap className="w-3 h-3 fill-current" />
          Upgrade Now
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
