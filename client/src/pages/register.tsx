import { useState } from "react";
import { useLocation } from "wouter";
import { useRegister } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HardHat, Eye, EyeOff, CheckCircle2, ArrowRight, Shield } from "lucide-react";

const TRIAL_FEATURES = [
  "Unlimited sites during trial",
  "Attendance & expense tracking",
  "Daily Progress Reports (DPR)",
  "Photo uploads & reporting",
  "No credit card required",
];

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-400" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-400" };
  return { score, label: "Strong", color: "bg-green-500" };
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pwStrength = getPasswordStrength(form.password);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email address";
    if (!form.mobile.trim()) newErrors.mobile = "Mobile number is required";
    else if (!/^\+?\d{10,15}$/.test(form.mobile.replace(/[\s\-()]/g, ""))) newErrors.mobile = "Enter a valid mobile number (10\u201315 digits)";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    registerMutation.mutate(
      {
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
      },
      {
        onSuccess: () => {
          toast({
            title: "Welcome to SiteTrack! 🎉",
            description: "Your 14-day free trial has started. Explore all features now.",
          });
          navigate("/dashboard");
        },
        onError: (err: Error) => {
          if (err.message.includes("already exists")) {
            setErrors({ email: "An account with this email already exists" });
          } else {
            toast({ title: "Registration failed", description: err.message, variant: "destructive" });
          }
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary flex-col justify-between p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
            <HardHat className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">SiteTrack</span>
        </div>

        <div className="space-y-8">
          <div>
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              14-Day Free Trial
            </Badge>
            <h2 className="text-4xl font-bold leading-tight mb-3">
              Manage your construction sites smarter
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Track attendance, expenses, DPRs and workers — all in one place.
            </p>
          </div>

          <ul className="space-y-3">
            {TRIAL_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/90 shrink-0" />
                <span className="text-primary-foreground/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-primary-foreground/60 text-sm">
          © 2026 SiteTrack · Construction Intelligence Platform
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-md">
              <HardHat className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SiteTrack</h1>
          </div>

          <Card className="shadow-lg border-border/60">
            <CardHeader className="pb-4">
              <Badge className="w-fit bg-primary/10 text-primary border-primary/20 mb-2">
                ✨ 14-Day Free Trial · No Credit Card
              </Badge>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                Start managing your construction sites today
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name + Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Pravin Desai"
                      value={form.name}
                      onChange={set("name")}
                      disabled={registerMutation.isPending}
                      data-testid="input-name"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Desai Constructions"
                      value={form.companyName}
                      onChange={set("companyName")}
                      disabled={registerMutation.isPending}
                      data-testid="input-company"
                    />
                    {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={set("email")}
                    autoComplete="email"
                    disabled={registerMutation.isPending}
                    data-testid="input-email"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                {/* Mobile */}
                <div className="space-y-1.5">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-md border bg-muted text-sm text-muted-foreground whitespace-nowrap">
                      🇮🇳 +91
                    </div>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="98765 43210"
                      value={form.mobile}
                      onChange={set("mobile")}
                      disabled={registerMutation.isPending}
                      data-testid="input-mobile"
                      className="flex-1"
                    />
                  </div>
                  {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={set("password")}
                      autoComplete="new-password"
                      disabled={registerMutation.isPending}
                      data-testid="input-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                {/* Password strength */}
                {form.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i <= pwStrength.score ? pwStrength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    {pwStrength.label && (
                      <p className="text-xs text-muted-foreground">
                        Password strength: <span className="font-medium">{pwStrength.label}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      autoComplete="new-password"
                      disabled={registerMutation.isPending}
                      data-testid="input-confirm-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2 py-6 text-base font-semibold"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    By signing up you agree to our{" "}
                    <button type="button" onClick={() => navigate("/terms-of-service")} className="text-primary underline underline-offset-2">Terms of Service</button>
                    {" "}and{" "}
                    <button type="button" onClick={() => navigate("/privacy-policy")} className="text-primary underline underline-offset-2">Privacy Policy</button>.
                    No credit card required.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
