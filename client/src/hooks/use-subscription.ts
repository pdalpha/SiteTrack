import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface Subscription {
  id?: number;
  userId?: number;
  planCode: "free_trial" | "starter" | "pro" | "business";
  billingInterval?: "monthly" | "yearly";
  gateway?: "razorpay" | "stripe" | null;
  gatewaySubscriptionId?: string | null;
  status: "trialing" | "active" | "cancelled" | "expired" | "past_due";
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  createdAt?: string;
}

export function useSubscription() {
  return useQuery<Subscription>({
    queryKey: ["/api/subscriptions/current"],
    retry: 1,
    staleTime: 60_000,
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/subscriptions/cancel", { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
      toast({
        title: "Subscription cancelled",
        description: "Your plan will remain active until the end of the current billing period.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

/** Returns days remaining until subscription period ends */
export function useDaysLeft(subscription?: Subscription | null): number | null {
  if (!subscription?.currentPeriodEnd) return null;
  const end = new Date(subscription.currentPeriodEnd).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export function useIsSubscriptionActive(subscription?: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.status === "active" || subscription.status === "trialing";
}
