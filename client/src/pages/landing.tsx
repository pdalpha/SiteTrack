import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    HardHat, Users, TrendingUp, Shield, Clock, BarChart3, Camera, Wallet,
    ArrowRight, CheckCircle2, Menu, X, Star, Building2, Truck, ClipboardList,
    Smartphone, Globe, ChevronRight, Play, Video, Loader2, Download
} from "lucide-react";

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_LINKS = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
];

function LandingNav() {
    const [open, setOpen] = useState(false);
    const [, navigate] = useLocation();

    return (
        <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
                            <HardHat className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">SiteTrack</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button variant="ghost" onClick={() => navigate("/login")}>
                            Log in
                        </Button>
                        <Button onClick={() => navigate("/register")}>
                            Start Free Trial
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile menu */}
                {open && (
                    <div className="md:hidden py-4 border-t space-y-2">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-2 flex flex-col gap-2">
                            <Button variant="outline" onClick={() => navigate("/login")}>
                                Log in
                            </Button>
                            <Button onClick={() => navigate("/register")}>
                                Start Free Trial
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

const HERO_STATS = [
    { value: "500+", label: "Construction Firms" },
    { value: "10,000+", label: "Workers Tracked" },
    { value: "₹50Cr+", label: "Expenses Managed" },
];

const HERO_FEATURES = [
    "14-day free trial · No credit card required",
    "Manage multiple sites from one dashboard",
    "Track attendance, expenses, DPRs & workers",
    "Photo uploads, reports & GST-compliant invoices",
];

function HeroSection() {
    const [, navigate] = useLocation();

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <Badge className="mb-6 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                        🚀 Construction Intelligence Platform — Trusted by 500+ firms
                    </Badge>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
                        Manage Your Construction Sites
                        <span className="block text-primary mt-2">Smarter, Faster, Together</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        Track attendance, expenses, daily progress reports and workers — all in one powerful platform built for Indian contractors and construction firms.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto gap-2 text-base px-8 py-6"
                            onClick={() => navigate("/register")}
                        >
                            Start 14-Day Free Trial
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto gap-2 text-base px-8 py-6"
                            onClick={() => navigate("/pricing")}
                        >
                            <Play className="w-4 h-4" />
                            View Pricing
                        </Button>
                    </div>

                    {/* Feature bullets */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                        {HERO_FEATURES.map((f) => (
                            <div key={f} className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                    {HERO_STATS.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Dashboard Preview Card */}
                <div className="mt-16 max-w-5xl mx-auto">
                    <div className="relative rounded-2xl border shadow-2xl overflow-hidden bg-card">
                        <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <span className="text-xs text-muted-foreground ml-2">SiteTrack Dashboard Preview</span>
                        </div>
                        <div className="bg-background p-6 sm:p-8">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                {[
                                    { label: "Active Sites", value: "5", icon: Building2, color: "text-primary" },
                                    { label: "Workers", value: "127", icon: Users, color: "text-blue-500" },
                                    { label: "Today's Attendance", value: "94%", icon: Clock, color: "text-green-500" },
                                    { label: "Monthly Expenses", value: "₹12.5L", icon: Wallet, color: "text-orange-500" },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-card border rounded-xl p-4">
                                        <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                                        <div className="text-xl font-bold">{stat.value}</div>
                                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-muted/30 rounded-xl p-4 h-32 flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">📊 Site overview dashboard with real-time KPIs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Demo Video Section ───────────────────────────────────────────────────────

const DEMO_STEPS = [
    {
        step: "01",
        title: "Create Your Account",
        desc: "Sign up in 30 seconds with just your name, email and mobile number. No credit card required.",
        icon: "👤",
    },
    {
        step: "02",
        title: "Add Your Sites & Workers",
        desc: "Create your construction sites, invite supervisors, and add your workforce — contractors and daily wage workers.",
        icon: "🏗️",
    },
    {
        step: "03",
        title: "Track Daily Operations",
        desc: "Mark attendance, log expenses, submit DPRs, and upload site photos — all from your phone or desktop.",
        icon: "📱",
    },
    {
        step: "04",
        title: "Get Reports & Insights",
        desc: "View real-time dashboards, export CSV reports, and make data-driven decisions for your construction business.",
        icon: "📊",
    },
];

function DemoVideoSection() {
    return (
        <section className="py-20 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">How It Works</Badge>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Get Started in 4 Simple Steps
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        From signup to tracking your first site in under 5 minutes. No training needed.
                    </p>
                </div>

                {/* Video placeholder */}
                <div className="max-w-4xl mx-auto mb-16">
                    <div className="relative aspect-video rounded-2xl border shadow-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button className="group flex items-center gap-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-4 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                    <Play className="w-6 h-6 fill-current ml-1" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-lg">Watch Demo</p>
                                    <p className="text-sm text-primary-foreground/80">2-minute overview</p>
                                </div>
                            </button>
                        </div>
                        {/* Video placeholder text */}
                        <div className="absolute bottom-4 left-4 right-4 text-center">
                            <p className="text-xs text-muted-foreground bg-background/80 inline-block px-3 py-1 rounded-full">
                                📹 Demo video coming soon — shows SiteTrack in action
                            </p>
                        </div>
                    </div>
                </div>

                {/* Steps */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
                    {DEMO_STEPS.map((item, idx) => (
                        <div key={item.step} className="relative">
                            {/* Connector line */}
                            {idx < DEMO_STEPS.length - 1 && (
                                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-border -translate-x-1/2" style={{ width: 'calc(100% - 2rem)' }} />
                            )}
                            <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl">{item.icon}</span>
                                    <span className="text-4xl font-bold text-primary/20">{item.step}</span>
                                </div>
                                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <Button size="lg" onClick={() => window.location.href = "/register"} className="gap-2">
                        Start Your Free Trial <ArrowRight className="w-4 h-4" />
                    </Button>
                    <p className="mt-3 text-sm text-muted-foreground">14 days free · No credit card · Setup in 5 minutes</p>
                </div>
            </div>
        </section>
    );
}

// ─── Dashboard Preview Section ────────────────────────────────────────────────

function DashboardPreviewSection() {
    const stats = [
        { label: "Active Sites", value: "12", change: "+2 this month", icon: Building2, color: "text-primary" },
        { label: "Total Workers", value: "847", change: "+45 this week", icon: Users, color: "text-blue-600" },
        { label: "Monthly Attendance", value: "94.2%", change: "+1.8% vs last month", icon: Clock, color: "text-green-600" },
        { label: "Expense Tracking", value: "₹2.4Cr", change: "This month", icon: Wallet, color: "text-amber-600" },
    ];

    const recentActivity = [
        { type: "attendance", site: "Tower A - Mumbai", time: "2 min ago", action: "45 workers marked present" },
        { type: "expense", site: "Site B - Pune", time: "15 min ago", action: "₹1,25,000水泥 Cement payment" },
        { type: "dpr", site: "Villa Project - Bangalore", time: "1 hour ago", action: "Daily progress report submitted" },
        { type: "payroll", site: "All Sites", time: "2 hours ago", action: "Monthly payroll generated" },
    ];

    return (
        <section id="dashboard-preview" className="py-20 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <Badge variant="secondary" className="mb-4">📊 Real Dashboard</Badge>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        Powerful Dashboard with Real-Time KPIs
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Get instant visibility into all your construction sites. Track attendance, expenses,
                        progress reports, and worker payments — all in one place.
                    </p>
                </div>

                {/* Dashboard Preview Card */}
                <Card className="shadow-2xl border-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <span className="text-sm text-muted-foreground ml-2">SiteTrack Dashboard</span>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x">
                            {/* Main Stats */}
                            <div className="p-6 lg:col-span-2 space-y-6">
                                <h3 className="text-lg font-semibold">📈 Overview</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {stats.map((stat) => (
                                        <div key={stat.label} className="bg-muted/50 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
                                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                            </div>
                                            <p className="text-sm font-medium">{stat.label}</p>
                                            <p className="text-xs text-muted-foreground">{stat.change}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Mini Chart Placeholder */}
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="flex items-end justify-between h-24 gap-2">
                                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-primary/40 rounded-t transition-all hover:bg-primary/60"
                                                style={{ height: `${h}%` }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                        <span>Jan</span>
                                        <span>Feb</span>
                                        <span>Mar</span>
                                        <span>Apr</span>
                                        <span>May</span>
                                        <span>Jun</span>
                                    </div>
                                    <p className="text-center text-sm text-muted-foreground mt-2">Monthly Attendance Trend</p>
                                </div>
                            </div>

                            {/* Sidebar - Recent Activity */}
                            <div className="p-6 bg-muted/30">
                                <h3 className="text-lg font-semibold mb-4">⚡ Recent Activity</h3>
                                <div className="space-y-4">
                                    {recentActivity.map((item, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                                            <div>
                                                <p className="text-sm font-medium">{item.site}</p>
                                                <p className="text-xs text-muted-foreground">{item.action}</p>
                                                <p className="text-xs text-muted-foreground/70 mt-1">{item.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" className="w-full mt-6" onClick={() => window.location.href = "/register"}>
                                    See Full Dashboard →
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Feature highlights below the dashboard */}
                <div className="grid sm:grid-cols-3 gap-8 mt-12">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-semibold mb-2">Real-Time Analytics</h4>
                        <p className="text-sm text-muted-foreground">Watch your KPIs update in real-time as workers check in and expenses are logged.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Smartphone className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-semibold mb-2">Mobile-Friendly</h4>
                        <p className="text-sm text-muted-foreground">Access your dashboard from any device. Perfect for on-site managers and owners on the go.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Download className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-semibold mb-2">Export Reports</h4>
                        <p className="text-sm text-muted-foreground">Generate GST invoices, attendance reports, and expense summaries with one click.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Features Section ─────────────────────────────────────────────────────────

const FEATURE_GROUPS = [
    {
        category: "Site Management",
        icon: Building2,
        color: "bg-primary/10 text-primary",
        features: [
            { icon: Building2, title: "Multi-Site Tracking", desc: "Manage multiple construction sites from a single dashboard. Switch between sites instantly and get consolidated reports." },
            { icon: Truck, title: "Contractor Management", desc: "Track contractors, their workers, payment terms, and performance across all your projects." },
            { icon: Camera, title: "Photo Documentation", desc: "Upload site photos with timestamps. Document progress, issues, and completed work visually." },
        ],
    },
    {
        category: "Worker & Attendance",
        icon: Users,
        color: "bg-blue-500/10 text-blue-500",
        features: [
            { icon: Users, title: "Smart Attendance", desc: "Mark attendance site-wise with half-day, present, and absent options. Track contractor workers seamlessly." },
            { icon: Clock, title: "Real-Time Check-In/Out", desc: "Record exact check-in and check-out times for workers. Overtime calculated automatically." },
            { icon: TrendingUp, title: "Productivity Insights", desc: "See attendance trends, worker availability, and contractor performance at a glance." },
        ],
    },
    {
        category: "Finance & Reports",
        icon: Wallet,
        color: "bg-green-500/10 text-green-500",
        features: [
            { icon: Wallet, title: "Expense Tracking", desc: "Track labour, material, equipment, transport, food and misc expenses. Upload bill photos for proof." },
            { icon: BarChart3, title: "DPR & Daily Reports", desc: "Submit Daily Progress Reports with work done, manpower, materials, machinery and delays." },
            { icon: ClipboardList, title: "CSV Report Export", desc: "Export attendance, expense and payroll data to CSV for your records or GST filings." },
        ],
    },
    {
        category: "Platform & Security",
        icon: Shield,
        color: "bg-purple-500/10 text-purple-500",
        features: [
            { icon: Smartphone, title: "Mobile Friendly", desc: "Full-featured on mobile and tablet. Manage your sites from anywhere on the go." },
            { icon: Globe, title: "Multi-Language Support", desc: "Use SiteTrack in English, Hindi (हिंदी), or Marathi (मराठी). Built for diverse Indian teams." },
            { icon: Shield, title: "Secure & Reliable", desc: "Your data is encrypted and protected. GST-compliant invoicing on Business plan." },
        ],
    },
];

function FeaturesSection() {
    return (
        <section id="features" className="py-20 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Features</Badge>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Everything You Need to Manage Construction Sites
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        From attendance tracking to expense management, SiteTrack covers the entire lifecycle of your construction projects.
                    </p>
                </div>

                <div className="space-y-16">
                    {FEATURE_GROUPS.map((group) => (
                        <div key={group.category}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${group.color}`}>
                                    <group.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-bold">{group.category}</h3>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {group.features.map((feature) => (
                                    <Card key={feature.title} className="group hover:shadow-lg transition-shadow">
                                        <CardContent className="p-6">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${group.color}`}>
                                                <feature.icon className="w-6 h-6" />
                                            </div>
                                            <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                                                {feature.title}
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {feature.desc}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Pricing Preview Section ──────────────────────────────────────────────────

const PRICING_PREVIEW = [
    { name: "Free Trial", price: "₹0", period: "/14 days", features: "1 site · 15 workers · Full access", cta: "Start Free", color: "border-border" },
    { name: "Starter", price: "₹999", period: "/month", features: "1 site · 50 workers · Core features", cta: "Choose Starter", color: "border-primary/30", recommended: false },
    { name: "Pro", price: "₹2,499", period: "/month", features: "5 sites · 200 workers · DPR & reports", cta: "Choose Pro", color: "border-primary shadow-lg shadow-primary/10", recommended: true },
    { name: "Business", price: "Custom", period: "", features: "Unlimited sites · Unlimited workers · GST invoices", cta: "Contact Sales", color: "border-border" },
];

function PricingPreviewSection() {
    const [, navigate] = useLocation();

    return (
        <section id="pricing" className="py-20 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Start free for 14 days. No credit card required. Plans designed for Indian contractors.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        <span>Prices in INR · GST extra · Razorpay & Stripe supported</span>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {PRICING_PREVIEW.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`relative flex flex-col ${plan.color} transition-shadow hover:shadow-md`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full shadow-sm">
                                        Recommended
                                    </Badge>
                                </div>
                            )}
                            <CardContent className="p-6 flex flex-col flex-1">
                                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-3xl font-bold">{plan.price}</span>
                                    {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                                </div>
                                <p className="text-sm text-muted-foreground mb-6 flex-1">{plan.features}</p>
                                <Button
                                    variant={plan.recommended ? "default" : "outline"}
                                    className="w-full"
                                    onClick={() => navigate("/pricing")}
                                >
                                    {plan.cta}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <Button variant="ghost" onClick={() => navigate("/pricing")} className="gap-2">
                        View Full Pricing Details <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </section>
    );
}

// ─── About Section ────────────────────────────────────────────────────────────

function AboutSection() {
    const values = [
        { icon: TrendingUp, title: "Built for India", desc: "Designed specifically for Indian contractors, with support for Hindi, Marathi, GST compliance, and UPI payments." },
        { icon: Users, title: "Team Focused", desc: "Multiple supervisors, contractors and admin users can collaborate on the same account with role-based access." },
        { icon: Shield, title: "Data Security", desc: "Your construction data is encrypted and securely stored. We never share your information with third parties." },
        { icon: Clock, title: "Save Time", desc: "Eliminate paper registers and spreadsheets. Track everything digitally and save hours of manual work every week." },
    ];

    return (
        <section id="about" className="py-20 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Text */}
                    <div>
                        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">About SiteTrack</Badge>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                            Construction Management,
                            <span className="text-primary"> Simplified</span>
                        </h2>
                        <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                            SiteTrack was born from the challenge of managing multiple construction sites with paper registers, WhatsApp messages, and scattered spreadsheets. We built a platform that brings everything together — attendance, expenses, daily reports, worker management, and payroll — into one intelligent dashboard.
                        </p>
                        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                            Trusted by 500+ construction firms across India, SiteTrack helps contractors save time, reduce errors, and run their operations more professionally.
                        </p>

                        {/* Testimonial */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-6">
                                <div className="flex gap-1 mb-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                    ))}
                                </div>
                                <p className="text-sm italic text-foreground mb-3">
                                    "SiteTrack reduced our attendance management time by 70%. We now track 3 sites, 80+ workers and all expenses from one place."
                                </p>
                                <p className="text-xs font-semibold text-muted-foreground">
                                    — Rajesh Patil, Desai Constructions, Pune
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Values */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        {values.map((value) => (
                            <Card key={value.title} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                        <value.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <h4 className="font-semibold mb-2">{value.title}</h4>
                                    <p className="text-sm text-muted-foreground">{value.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Contact Section ──────────────────────────────────────────────────────────

function ContactSection() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [form, setForm] = useState({ name: "", email: "", mobile: "", message: "" });
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                setSubmitted(true);
            } else {
                toast({ title: "Error", description: data.error || "Failed to send message", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="contact" className="py-20 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16">
                    {/* Left: Info */}
                    <div>
                        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Contact Us</Badge>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                            Get in Touch
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                            Have questions about SiteTrack? Want a custom demo or enterprise pricing? Our team is here to help you get started.
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: "📧", label: "Email", value: "support@sitetrack.app" },
                                { icon: "📱", label: "Phone / WhatsApp", value: "+91 98765 43210" },
                                { icon: "🌐", label: "Website", value: "www.sitetrack.app" },
                            ].map((contact) => (
                                <div key={contact.label} className="flex items-center gap-4">
                                    <span className="text-2xl">{contact.icon}</span>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{contact.label}</p>
                                        <p className="font-semibold">{contact.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div>
                        <Card className="shadow-lg">
                            <CardContent className="p-6 sm:p-8">
                                {submitted ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-bold">Message Sent!</h3>
                                        <p className="text-muted-foreground">
                                            Thank you for reaching out. We'll get back to you within 24 hours.
                                        </p>
                                        <Button variant="outline" onClick={() => setSubmitted(false)}>
                                            Send Another Message
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <h3 className="text-lg font-bold mb-4">Send us a message</h3>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium">Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    placeholder="Your full name"
                                                    value={form.name}
                                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium">Mobile</label>
                                                <input
                                                    type="tel"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    placeholder="+91 XXXXX XXXXX"
                                                    value={form.mobile}
                                                    onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium">Email *</label>
                                            <input
                                                type="email"
                                                required
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                placeholder="you@company.com"
                                                value={form.email}
                                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium">Message *</label>
                                            <textarea
                                                required
                                                rows={4}
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px]"
                                                placeholder="Tell us about your requirements..."
                                                value={form.message}
                                                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    Send Message <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
    const [, navigate] = useLocation();

    return (
        <section className="py-20 bg-primary text-primary-foreground">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    Ready to Transform Your Site Management?
                </h2>
                <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
                    Join 500+ construction firms already using SiteTrack. Start your 14-day free trial today — no credit card required.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        size="lg"
                        variant="secondary"
                        className="w-full sm:w-auto gap-2 text-base px-8"
                        onClick={() => navigate("/register")}
                    >
                        Start Free Trial
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto gap-2 text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                        onClick={() => navigate("/pricing")}
                    >
                        View Pricing
                    </Button>
                </div>
            </div>
        </section>
    );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
    return (
        <footer className="bg-background border-t py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                                <HardHat className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="text-lg font-bold">SiteTrack</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Construction Intelligence Platform for Indian contractors and firms.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                            <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                            <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#about" className="hover:text-foreground transition-colors">About Us</a></li>
                            <li><a href="#contact" className="hover:text-foreground transition-colors">Contact</a></li>
                            <li><a href="#contact" className="hover:text-foreground transition-colors">Careers</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                            <li><Link href="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © 2025 SiteTrack · Construction Intelligence Platform. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>🇮🇳 Made in India</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            <LandingNav />
            <main>
                <HeroSection />
                <DemoVideoSection />
                <DashboardPreviewSection />
                <FeaturesSection />
                <PricingPreviewSection />
                <AboutSection />
                <ContactSection />
                <CTASection />
            </main>
            <LandingFooter />
        </div>
    );
}