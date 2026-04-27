import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function TermsOfServicePage() {
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
                <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
                <p className="text-muted-foreground mb-8">Last updated: April 27, 2026</p>

                <Card className="shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground">
                                By accessing or using SiteTrack's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">2. Description of Service</h2>
                            <p className="text-muted-foreground">
                                SiteTrack provides a construction management platform that includes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Site and project management tools</li>
                                <li>Worker and attendance tracking</li>
                                <li>Expense and payroll management</li>
                                <li>Daily Progress Reports (DPR)</li>
                                <li>Report generation and export features</li>
                                <li>Multi-language support (English, Hindi, Marathi)</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">3. User Accounts</h2>
                            <p className="text-muted-foreground">
                                To access our services, you must create an account. You are responsible for:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Maintaining the confidentiality of your login credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized use</li>
                                <li>Providing accurate and complete information</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">4. Free Trial Period</h2>
                            <p className="text-muted-foreground">
                                New users receive a 14-day free trial to explore SiteTrack's features. During the trial:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Full access to all features is provided</li>
                                <li>No payment information is required to start</li>
                                <li>Your data is preserved until you choose a paid plan</li>
                                <li>After trial ends, you must subscribe to continue access</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">5. Subscription & Billing</h2>
                            <p className="text-muted-foreground">
                                Paid subscriptions include:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Monthly or annual billing cycles</li>
                                <li>Prices vary by region (India via Razorpay, International via Stripe)</li>
                                <li>Automatic renewal unless cancelled before the billing date</li>
                                <li>All applicable taxes are the user's responsibility</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">6. Acceptable Use</h2>
                            <p className="text-muted-foreground">
                                You agree not to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Use the service for any illegal purpose</li>
                                <li>Attempt to gain unauthorized access to our systems</li>
                                <li>Reverse engineer, decompile, or disassemble the software</li>
                                <li>Share your account credentials with others</li>
                                <li>Upload viruses or malicious code</li>
                                <li>Harass, abuse, or harm other users</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">7. Data Ownership</h2>
                            <p className="text-muted-foreground">
                                You retain ownership of all data you input into SiteTrack. We claim no ownership rights over your data. You are solely responsible for ensuring you have the right to use and share any data you upload.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">8. Intellectual Property</h2>
                            <p className="text-muted-foreground">
                                The service, including its design, text, graphics, and software, is owned by SiteTrack and protected by intellectual property laws. You may not copy, modify, or distribute our content without permission.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">9. Termination</h2>
                            <p className="text-muted-foreground">
                                We reserve the right to suspend or terminate your account if:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>You violate these Terms of Service</li>
                                <li>You engage in fraudulent or illegal activity</li>
                                <li>You fail to pay for subscribed services</li>
                            </ul>
                            <p className="text-muted-foreground mt-4">
                                You may cancel your subscription at any time through your account settings.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">10. Disclaimer of Warranties</h2>
                            <p className="text-muted-foreground">
                                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">11. Limitation of Liability</h2>
                            <p className="text-muted-foreground">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SITETRACK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES RESULTING FROM YOUR USE OF THE SERVICE.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">12. Changes to Terms</h2>
                            <p className="text-muted-foreground">
                                We may update these Terms of Service from time to time. We will notify you of significant changes via email or through the service. Continued use after changes constitutes acceptance of the new terms.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">13. Governing Law</h2>
                            <p className="text-muted-foreground">
                                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold">14. Contact Information</h2>
                            <p className="text-muted-foreground">
                                For questions about these Terms, please contact us:
                            </p>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <p className="font-medium">SiteTrack Support</p>
                                <p className="text-muted-foreground">Email: legal@sitetrack.app</p>
                                <p className="text-muted-foreground">Phone: +91 98765 43210</p>
                            </div>
                        </section>
                    </CardContent>
                </Card>

                <div className="mt-8 flex justify-center gap-4">
                    <Link href="/privacy-policy">
                        <Button variant="outline">Privacy Policy</Button>
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