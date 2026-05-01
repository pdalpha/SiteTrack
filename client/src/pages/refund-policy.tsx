import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold text-primary">
                        SiteTrack
                    </Link>
                    <div className="flex gap-4">
                        <Link href="/login">
                            <Button variant="ghost">Login</Button>
                        </Link>
                        <Link href="/register">
                            <Button>Start Free Trial</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-4xl font-bold mb-2">Refund Policy</h1>
                <p className="text-muted-foreground mb-8">Last updated: April 27, 2026</p>

                <Card className="shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">1. Refund Eligibility</h2>
                            <p className="text-muted-foreground">
                                We want you to be satisfied with SiteTrack. If you're not completely happy with your purchase, we offer refunds under the following conditions:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>7-day money-back guarantee:</strong> Request a full refund within 7 days of your first payment</li>
                                <li><strong>Technical issues:</strong> If the service is consistently unavailable or broken due to our systems</li>
                                <li><strong>Billing errors:</strong> If you were charged incorrectly or double-charged</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">2. Non-Refundable Situations</h2>
                            <p className="text-muted-foreground">
                                Refunds may not be available in the following cases:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Requests made after 7 days from the original purchase date</li>
                                <li>Partial month usage (refunds are not provided for unused time)</li>
                                <li>Account termination due to violation of Terms of Service</li>
                                <li>Change of mind after the 7-day window</li>
                                <li>Failure to cancel automatic renewal before the billing date</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">3. How to Request a Refund</h2>
                            <p className="text-muted-foreground">
                                To request a refund, please contact our support team:
                            </p>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <p className="font-medium">Refund Requests</p>
                                <p className="text-muted-foreground">Email: <a href="mailto:refunds@sitetrack.site" className="text-primary hover:underline">refunds@sitetrack.site</a></p>
                                <p className="text-muted-foreground">Hours: Monday – Saturday, 9 AM – 6 PM IST</p>
                                <p className="text-muted-foreground text-sm">Typical response time: within one business day.</p>
                            </div>
                            <p className="text-muted-foreground">
                                Please include your account email, invoice number, and reason for the refund request.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">4. Refund Processing</h2>
                            <p className="text-muted-foreground">
                                Once your refund request is approved:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li><strong>India (Razorpay):</strong> Refunds are processed within 5-10 business days to your original payment method</li>
                                <li><strong>International (Stripe):</strong> Refunds are processed within 5-10 business days to your original payment method</li>
                                <li><strong>Processing time:</strong> After we process the refund, it may take an additional 5-10 days for the refund to appear on your statement</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">5. Subscription Cancellations</h2>
                            <p className="text-muted-foreground">
                                You may cancel your subscription at any time:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Cancelled subscriptions remain active until the end of the current billing period</li>
                                <li>No partial refunds are provided for the remaining days in the billing cycle</li>
                                <li>You can cancel through your account settings or by contacting support</li>
                                <li>Your data is retained for 30 days after subscription ends</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">6. Downgrades</h2>
                            <p className="text-muted-foreground">
                                If you wish to downgrade your plan:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Downgrades take effect at the start of the next billing cycle</li>
                                <li>No refunds are provided for the price difference</li>
                                <li>If your current usage exceeds the new plan limits, you may need to reduce usage before the downgrade</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">7. Chargebacks</h2>
                            <p className="text-muted-foreground">
                                Before initiating a chargeback with your bank, please contact us first. Chargebacks can result in:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Immediate account suspension</li>
                                <li>Additional fees from payment processors</li>
                                <li>Deletion of your data after 30 days</li>
                            </ul>
                            <p className="text-muted-foreground">
                                We will work with you to resolve any billing issues before a chargeback becomes necessary.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">8. Data After Refund</h2>
                            <p className="text-muted-foreground">
                                If your refund is approved:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Your account access will be downgraded to the free trial level</li>
                                <li>You can export your data before the trial period ends</li>
                                <li>After the trial period, your data will be retained for 30 days</li>
                                <li>After 30 days, all data will be permanently deleted from our servers</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">9. Free Trial Users</h2>
                            <p className="text-muted-foreground">
                                Users on the free trial:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>No payment is required during the trial period</li>
                                <li>You will not be charged unless you explicitly subscribe to a paid plan</li>
                                <li>After the trial, your data is preserved but access is limited until you subscribe</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">10. Policy Changes</h2>
                            <p className="text-muted-foreground">
                                We may update this Refund Policy from time to time. For significant changes, we will notify you via email. Refund requests will be evaluated based on the policy in effect at the time of the request.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">11. Contact Us</h2>
                            <p className="text-muted-foreground">
                                If you have any questions about our Refund Policy, please contact us:
                            </p>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <p className="font-medium">SiteTrack Support</p>
                                <p className="text-muted-foreground">Email: <a href="mailto:support@sitetrack.site" className="text-primary hover:underline">support@sitetrack.site</a></p>
                                <p className="text-muted-foreground text-sm">We respond within 24–48 business hours.</p>
                            </div>
                        </section>
                    </CardContent>
                </Card>

                <div className="mt-8 flex justify-center gap-4">
                    <Link href="/privacy-policy">
                        <Button variant="outline">Privacy Policy</Button>
                    </Link>
                    <Link href="/terms-of-service">
                        <Button variant="outline">Terms of Service</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost">← Back to Home</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}