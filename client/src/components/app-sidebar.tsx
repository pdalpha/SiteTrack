import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardCheck,
  FileText,
  Wallet,
  HardHat,
  BarChart2,
  UserCircle,
  LogOut,
  CreditCard,
  Briefcase,
  Banknote,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const navItems = [
  { title: "nav.dashboard", url: "/", icon: LayoutDashboard },
  { title: "nav.sites", url: "/sites", icon: Building2 },
  { title: "nav.workers", url: "/workers", icon: HardHat },
  { title: "nav.contractors", url: "/contractors", icon: Briefcase },
  { title: "nav.attendance", url: "/attendance", icon: ClipboardCheck },
  { title: "nav.dailyReport", url: "/dpr", icon: FileText },
  { title: "nav.expenses", url: "/expenses", icon: Wallet },
  { title: "nav.payroll", url: "/payroll", icon: Banknote },
  { title: "nav.reports", url: "/reports", icon: BarChart2 },
  { title: "nav.users", url: "/users", icon: Users },
  { title: "nav.pricing", url: "/pricing", icon: CreditCard },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const { t } = useTranslation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.hash = "#/login";
        window.location.reload();
      },
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <HardHat className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">SiteTrack</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={isActive ? "bg-sidebar-accent font-medium" : ""}
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.split(".")[1]}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{t(item.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t space-y-2">
        {user && (
          <>
            <Link href="/profile">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer" data-testid="nav-profile">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0 capitalize">{user.role}</Badge>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? t("nav.signingOut") : t("nav.logout")}
            </Button>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
