import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { TrialBanner } from "@/components/trial-banner";
import { WhatsAppButton } from "@/components/whatsapp-button";
import Dashboard from "@/pages/dashboard";
import SitesPage from "@/pages/sites";
import AttendancePage from "@/pages/attendance";
import DprPage from "@/pages/dpr";
import ExpensesPage from "@/pages/expenses";
import UsersPage from "@/pages/users";
import ReportsPage from "@/pages/reports";
import ProfilePage from "@/pages/profile";
import PricingPage from "@/pages/pricing";
import WorkersPage from "@/pages/workers";
import ContractorsPage from "@/pages/contractors";
import PayrollPage from "@/pages/payroll";
import MaterialsPage from "@/pages/materials";
import IssuesPage from "@/pages/issues";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import SubscriptionSuccess from "@/pages/subscription-success";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import LandingPage from "@/pages/landing";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import RefundPolicyPage from "@/pages/refund-policy";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
];

function LanguageSelector() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    // Sync i18n FROM user's saved preference on login / when it changes server-side.
    // Do NOT depend on i18n itself — that caused a revert loop on toggle.
    if (user?.preferredLanguage && user.preferredLanguage !== i18n.language) {
      i18n.changeLanguage(user.preferredLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferredLanguage]);

  const updateLangMutation = useMutation({
    mutationFn: async (lang: string) => {
      if (!user) return;
      await fetch(`./api/users/${user.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: lang }),
      });
    },
    onSuccess: () => {
      // Refresh the cached user so user.preferredLanguage matches the new value.
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    updateLangMutation.mutate(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-language-selector">
          <Globe className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={i18n.language === lang.code ? "bg-accent font-medium" : ""}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Default route: landing for public, dashboard for authenticated */}
      <Route path="/">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <LandingPage />}
      </Route>

      {/* Public routes */}
      <Route path="/landing" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/refund-policy" component={RefundPolicyPage} />

      {/* Protected routes - redirect to login if not authenticated */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/sites" component={() => <ProtectedRoute component={SitesPage} />} />
      <Route path="/attendance" component={() => <ProtectedRoute component={AttendancePage} />} />
      <Route path="/dpr" component={() => <ProtectedRoute component={DprPage} />} />
      <Route path="/expenses" component={() => <ProtectedRoute component={ExpensesPage} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/workers" component={() => <ProtectedRoute component={WorkersPage} />} />
      <Route path="/contractors" component={() => <ProtectedRoute component={ContractorsPage} />} />
      <Route path="/payroll" component={() => <ProtectedRoute component={PayrollPage} />} />
      <Route path="/materials" component={() => <ProtectedRoute component={MaterialsPage} />} />
      <Route path="/issues" component={() => <ProtectedRoute component={IssuesPage} />} />
      <Route path="/subscription/success" component={() => <ProtectedRoute component={SubscriptionSuccess} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };
  const { isAuthenticated } = useAuth();

  return (
    <Router hook={useHashLocation}>
      <Switch>
        {/* Public routes — no sidebar (landing, login, register, pricing) */}
        <Route path="/landing">{() => <LandingPage />}</Route>
        <Route path="/login">{() => <LoginPage />}</Route>
        <Route path="/register">{() => <RegisterPage />}</Route>
        <Route path="/pricing">{() => <PricingPage />}</Route>
        <Route path="/privacy-policy">{() => <PrivacyPolicyPage />}</Route>
        <Route path="/terms-of-service">{() => <TermsOfServicePage />}</Route>
        <Route path="/refund-policy">{() => <RefundPolicyPage />}</Route>

        {/* All other routes use the sidebar layout */}
        <Route>
          {isAuthenticated ? (
            <SidebarProvider style={sidebarStyle as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 min-w-0">
                  <TrialBanner />
                  <header className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <div className="flex items-center gap-2">
                      <LanguageSelector />
                      <ThemeToggle />
                    </div>
                  </header>
                  <main className="flex-1 overflow-y-auto">
                    <AppRouter />
                  </main>
                </div>
              </div>
            </SidebarProvider>
          ) : (
            /* Not authenticated - show landing page */
            <LandingPage />
          )}
        </Route>
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppLayout />
          <WhatsAppButton />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
