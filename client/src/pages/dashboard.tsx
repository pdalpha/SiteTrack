import { useQuery } from "@tanstack/react-query";
import { useSiteSelector } from "@/hooks/use-sites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Wallet, FileText, IndianRupee } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Expense, Attendance } from "@shared/schema";
import { EXPENSE_CATEGORY_LABELS } from "@shared/schema";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

const CHART_COLORS = ["hsl(25 85% 48%)", "hsl(183 60% 32%)", "hsl(103 50% 35%)", "hsl(43 74% 49%)", "hsl(262 50% 48%)", "hsl(0 72% 45%)"];

export default function Dashboard() {
  const { sites, selectedSiteId, setSelectedSiteId, isLoading: sitesLoading } = useSiteSelector();
  const { t } = useTranslation();

  // Seed data on first load
  useEffect(() => {
    apiRequest("api/seed", { method: "POST" }).catch(() => {});
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    activeSites: number;
    todayAttendance: number;
    todayExpenses: number;
    pendingDprs: number;
    totalWorkers: number;
    monthlyPayroll: number;
  }>({
    queryKey: ["/api/dashboard/stats", selectedSiteId],
    queryFn: async () => {
      const url = selectedSiteId
        ? `./api/dashboard/stats?site_id=${selectedSiteId}`
        : "./api/dashboard/stats";
      const res = await fetch(url);
      return res.json();
    },
    enabled: !sitesLoading,
  });

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const { data: todayAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", selectedSiteId, today],
    queryFn: async () => {
      if (!selectedSiteId) return [];
      const res = await fetch(`./api/attendance?site_id=${selectedSiteId}&date=${today}`);
      return res.json();
    },
    enabled: !!selectedSiteId,
  });

  const { data: expenseSummary = [] } = useQuery<{ category: string; total: number }[]>({
    queryKey: ["/api/expenses/summary", selectedSiteId, currentMonth],
    queryFn: async () => {
      if (!selectedSiteId) return [];
      const res = await fetch(`./api/expenses/summary?site_id=${selectedSiteId}&month=${currentMonth}`);
      return res.json();
    },
    enabled: !!selectedSiteId,
  });

  const attendancePieData = (() => {
    const present = todayAttendance.filter((a) => a.status === "present").length;
    const absent = todayAttendance.filter((a) => a.status === "absent").length;
    const halfDay = todayAttendance.filter((a) => a.status === "half_day").length;
    return [
      { name: "Present", value: present, color: "hsl(103 50% 35%)" },
      { name: "Absent", value: absent, color: "hsl(0 72% 45%)" },
      { name: "Half Day", value: halfDay, color: "hsl(43 74% 49%)" },
    ].filter((d) => d.value > 0);
  })();

  const expenseChartData = expenseSummary.map((e) => ({
    name: EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] || e.category,
    amount: e.total,
  }));

  const isLoading = sitesLoading || statsLoading;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">{t("nav.dashboard")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.overview")}
          </p>
        </div>
        <Select
          value={selectedSiteId?.toString() ?? ""}
          onValueChange={(v) => setSelectedSiteId(Number(v))}
        >
          <SelectTrigger className="w-[220px]" data-testid="select-site">
            <SelectValue placeholder={t("dashboard.allSites")} />
          </SelectTrigger>
          <SelectContent>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id.toString()}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card data-testid="card-active-sites">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("dashboard.activeSites")}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{stats?.activeSites ?? 0}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-today-attendance">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("dashboard.presentToday")}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">
                  {stats?.todayAttendance ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-today-expenses">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("dashboard.todayExpenses")}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  ₹{(stats?.todayExpenses ?? 0).toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-pending-dprs">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("dashboard.pendingDprs")}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {stats?.pendingDprs ?? 0}
                </p>
                {(stats?.pendingDprs ?? 0) > 0 && (
                  <Badge variant="destructive" className="mt-1 text-xs">Pending</Badge>
                )}
              </CardContent>
            </Card>
            <Card data-testid="card-total-workers">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("dashboard.totalWorkers")}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{stats?.totalWorkers ?? 0}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-monthly-payroll">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("dashboard.monthlyPayroll")}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  ₹{(stats?.monthlyPayroll ?? 0).toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{t("dashboard.todaysAttendance")}</CardTitle>
          </CardHeader>
          <CardContent>
            {attendancePieData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {attendancePieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {attendancePieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-medium tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t("dashboard.noAttendance")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expense Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{t("dashboard.expensesByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={expenseChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Amount"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {expenseChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t("dashboard.noExpense")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
