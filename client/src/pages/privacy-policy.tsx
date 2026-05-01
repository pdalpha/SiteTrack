import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PrivacyPolicyPage() {
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
                <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-muted-foreground mb-8">Last updated: April 27, 2026</p>

                <Card className="shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
                            <p className="text-muted-foreground">
                                We collect information you provide directly to us, including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Account information (name, email, phone number, password)</li>
                                <li>Company and site details for construction project management</li>
                                <li>Worker and contractor information for attendance tracking</li>
                                <li>Financial data including expenses, payroll, and billing information</li>
                                <li>Daily Progress Reports (DPR) and project documentation</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
                            <p className="text-muted-foreground">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Provide, maintain, and improve our services</li>
                                <li>Process transactions and send related information</li>
                                <li>Send you technical notices, updates, and support messages</li>
                                <li>Respond to your comments, questions, and requests</li>
                                <li>Monitor and analyze trends, usage, and activities</li>
                                <li>Detect, investigate, and prevent fraudulent transactions</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">3. Information Sharing</h2>
                            <p className="text-muted-foreground">
                                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Service providers who assist in our operations</li>
                                <li>Payment processors (Razorpay for India, Stripe for international)</li>
                                <li>Legal authorities when required by law</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">4. Data Security</h2>
                            <p className="text-muted-foreground">
                                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">5. Data Retention</h2>
                            <p className="text-muted-foreground">
                                We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">6. Your Rights</h2>
                            <p className="text-muted-foreground">
                                Depending on your location, you may have the right to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Access the personal information we hold about you</li>
                                <li>Request correction of inaccurate information</li>
                                <li>Request deletion of your personal information</li>
                                <li>Object to or restrict certain processing activities</li>
                                <li>Data portability</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">7. Cookies & Tracking</h2>
                            <p className="text-muted-foreground">
                                We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">8. Contact Us</h2>
                            <p className="text-muted-foreground">
                                If you have any questions about this Privacy Policy, please contact us at:
                            </p>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <p className="font-medium">SiteTrack Support</p>
                                <p className="text-muted-foreground">Email: <a href="mailto:privacy@sitetrack.site" className="text-primary hover:underline">privacy@sitetrack.site</a></p>
                                <p className="text-muted-foreground text-sm">We respond within 24–48 business hours.</p>
                            </div>
                        </section>
                    </CardContent>
                </Card>

                <div className="mt-8 flex justify-center gap-4">
                    <Link href="/terms-of-service">
                        <Button variant="outline">Terms of Service</Button>
                    </Link>
                    <Link href="/refund-policy">
                        <Button variant="outline">Refund Policy</Button>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost">← Back to Home</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}