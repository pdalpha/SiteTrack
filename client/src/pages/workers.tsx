import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSites } from "@/hooks/use-sites";
import { useContractors } from "@/hooks/use-contractors";
import type { Worker, InsertWorker } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search, Pencil, ToggleLeft, ToggleRight, Users, IndianRupee, HardHat, TrendingUp, Download } from "lucide-react";
import { downloadCSV } from "@/lib/export-utils";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(25 85% 48%)", "hsl(183 60% 32%)", "hsl(103 50% 35%)",
  "hsl(43 74% 49%)", "hsl(262 50% 48%)", "hsl(0 72% 45%)",
  "hsl(200 70% 40%)", "hsl(320 60% 45%)", "hsl(160 55% 38%)",
];

const TRADES = ["Mason", "Carpenter", "Electrician", "Plumber", "Painter", "Welder", "Helper", "Supervisor", "Other"];

const emptyForm = {
  name: "",
  phone: "",
  trade: "",
  contractorId: null as number | null,
  siteId: null as number | null,
  wageType: "daily" as "daily" | "monthly",
  dailyWage: 0,
  monthlySalary: null as number | null,
  overtimeRate: 0,
  joiningDate: new Date().toISOString().slice(0, 10),
  status: "active" as "active" | "inactive",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function WorkersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: sites = [] } = useSites();
  const { data: contractors = [] } = useContractors();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: workers = [], isLoading } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
    queryFn: async () => {
      const res = await fetch("./api/workers");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertWorker>) => {
      const res = await apiRequest("api/workers", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      closeDialog();
      toast({ title: editWorker ? "Worker updated" : "Worker added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertWorker> }) => {
      const res = await apiRequest(`api/workers/${id}`, { method: "PUT", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      closeDialog();
      toast({ title: "Worker updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditWorker(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (w: Worker) => {
    setEditWorker(w);
    setForm({
      name: w.name, phone: w.phone ?? "", trade: w.trade ?? "",
      contractorId: w.contractorId ?? null, siteId: w.siteId ?? null,
      wageType: w.wageType, dailyWage: w.dailyWage, monthlySalary: w.monthlySalary ?? null,
      overtimeRate: w.overtimeRate ?? 0, joiningDate: w.joiningDate ?? new Date().toISOString().slice(0, 10),
      status: w.status,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditWorker(null); };

  const handleSubmit = () => {
    if (!form.name || form.dailyWage < 0) return;
    const payload = { ...form, phone: form.phone || null, trade: form.trade || null };
    if (editWorker) { updateMutation.mutate({ id: editWorker.id, data: payload }); }
    else { createMutation.mutate(payload); }
  };

  const toggleStatus = (w: Worker) => {
    updateMutation.mutate({ id: w.id, data: { status: w.status === "active" ? "inactive" : "active" } });
  };

  const getContractorName = (id: number | null) => id ? (contractors.find(c => c.id === id)?.name ?? "—") : "—";
  const getSiteName = (id: number | null) => id ? (sites.find(s => s.id === id)?.name ?? "—") : "—";

  const filtered = workers.filter(w => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || (w.phone ?? "").includes(search);
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    const matchSite = siteFilter === "all" || String(w.siteId) === siteFilter;
    return matchSearch && matchStatus && matchSite;
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const activeWorkers = workers.filter(w => w.status === "active");
  const totalDailyLabour = activeWorkers.reduce((s, w) => s + w.dailyWage, 0);
  const avgWage = activeWorkers.length ? Math.round(totalDailyLabour / activeWorkers.length) : 0;

  // Chart data
  const tradeData = TRADES
    .map(t => ({ name: t, count: workers.filter(w => w.trade === t).length }))
    .filter(d => d.count > 0);

  const statusPieData = [
    { name: "Active", value: workers.filter(w => w.status === "active").length, color: "hsl(103 50% 35%)" },
    { name: "Inactive", value: workers.filter(w => w.status === "inactive").length, color: "hsl(0 0% 60%)" },
  ].filter(d => d.value > 0);

  const contractorData = contractors
    .map(c => ({
      name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
      workers: workers.filter(w => w.contractorId === c.id && w.status === "active").length,
    }))
    .filter(d => d.workers > 0);

  const siteData = sites
    .map(s => ({
      name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
      workers: workers.filter(w => w.siteId === s.id && w.status === "active").length,
    }))
    .filter(d => d.workers > 0);

  const showCharts = workers.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">{t("nav.workers")}</h1>
          <p className="text-sm text-muted-foreground">{workers.length} {t("workers.registered")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCSV(filtered.map(w => ({
            Name: w.name,
            Phone: w.phone ?? "",
            Trade: w.trade ?? "",
            Contractor: getContractorName(w.contractorId),
            Site: getSiteName(w.siteId),
            WageType: w.wageType,
            DailyWage: w.dailyWage,
            MonthlySalary: w.monthlySalary ?? "",
            OvertimeRate: w.overtimeRate,
            JoiningDate: w.joiningDate ?? "",
            Status: w.status,
          })), `workers_export_${new Date().toISOString().slice(0,10)}.csv`)} disabled={!filtered.length}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button onClick={openAdd} data-testid="button-add-worker">
            <UserPlus className="w-4 h-4 mr-1" /> {t("common.add")} {t("nav.workers")}
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Workers", value: workers.length, icon: Users, color: "" },
          { label: "Active Workers", value: activeWorkers.length, icon: HardHat, color: "text-green-600 dark:text-green-400" },
          { label: "Avg Daily Wage", value: `₹${avgWage.toLocaleString("en-IN")}`, icon: IndianRupee, color: "" },
          { label: "Daily Labour Cost", value: `₹${totalDailyLabour.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts — only shown when data exists */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Workers by Trade */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Workers by Trade</CardTitle>
            </CardHeader>
            <CardContent>
              {tradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={tradeData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Workers" radius={[4, 4, 0, 0]}>
                      {tradeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">No trade data</p>
              )}
            </CardContent>
          </Card>

          {/* Active vs Inactive Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {statusPieData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                        dataKey="value" strokeWidth={0}>
                        {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-1">
                    {statusPieData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">No data</p>
              )}
            </CardContent>
          </Card>

          {/* Workers per Contractor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">By Contractor</CardTitle>
            </CardHeader>
            <CardContent>
              {contractorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={contractorData} layout="vertical" barSize={16}>
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="workers" name="Workers" radius={[0, 4, 4, 0]}>
                      {contractorData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">No contractor data</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or phone..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-worker" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workers</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-site-filter"><SelectValue placeholder="All Sites" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search ? "No workers match your search" : "No workers yet. Add your first worker."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Wage Type</TableHead>
                    <TableHead>Daily Wage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(w => (
                    <TableRow key={w.id} data-testid={`row-worker-${w.id}`}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell className="tabular-nums text-sm">{w.phone ?? "—"}</TableCell>
                      <TableCell className="text-sm">{w.trade ?? "—"}</TableCell>
                      <TableCell className="text-sm">{getContractorName(w.contractorId)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getSiteName(w.siteId)}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-xs">{w.wageType}</Badge></TableCell>
                      <TableCell className="tabular-nums text-sm">₹{w.dailyWage.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge className={w.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 text-xs"}>
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(w)} data-testid={`button-edit-worker-${w.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleStatus(w)} data-testid={`button-toggle-worker-${w.id}`}>
                            {w.status === "active"
                              ? <ToggleRight className="w-4 h-4 text-green-600" />
                              : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editWorker ? "Edit Worker" : "Add Worker"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Worker Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Raju Kamble" data-testid="input-worker-name" />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={form.phone ?? ""} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210" inputMode="numeric" data-testid="input-worker-phone" />
              </div>
              <div>
                <Label>Trade</Label>
                <Select value={form.trade ?? ""} onValueChange={v => setForm({ ...form, trade: v })}>
                  <SelectTrigger data-testid="select-worker-trade"><SelectValue placeholder="Select trade" /></SelectTrigger>
                  <SelectContent>{TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contractor</Label>
                <Select value={form.contractorId?.toString() ?? "none"} onValueChange={v => setForm({ ...form, contractorId: v === "none" ? null : Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {contractors.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned Site</Label>
                <Select value={form.siteId?.toString() ?? "none"} onValueChange={v => setForm({ ...form, siteId: v === "none" ? null : Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {sites.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Wage Type</Label>
                <Select value={form.wageType} onValueChange={v => setForm({ ...form, wageType: v as any })}>
                  <SelectTrigger data-testid="select-wage-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.wageType === "daily" ? (
                <div>
                  <Label>Daily Wage (₹) *</Label>
                  <Input type="number" min="0" value={form.dailyWage}
                    onChange={e => setForm({ ...form, dailyWage: Number(e.target.value) })}
                    data-testid="input-daily-wage" />
                </div>
              ) : (
                <div>
                  <Label>Monthly Salary (₹) *</Label>
                  <Input type="number" min="0" value={form.monthlySalary ?? ""}
                    onChange={e => setForm({ ...form, monthlySalary: Number(e.target.value) })}
                    data-testid="input-monthly-salary" />
                </div>
              )}
              <div>
                <Label>Overtime Rate (₹/hr)</Label>
                <Input type="number" min="0" value={form.overtimeRate}
                  onChange={e => setForm({ ...form, overtimeRate: Number(e.target.value) })}
                  data-testid="input-overtime-rate" />
              </div>
              <div>
                <Label>Joining Date</Label>
                <Input type="date" value={form.joiningDate}
                  onChange={e => setForm({ ...form, joiningDate: e.target.value })}
                  data-testid="input-joining-date" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" disabled={!form.name || isPending} onClick={handleSubmit} data-testid="button-submit-worker">
              {isPending ? "Saving..." : editWorker ? "Update Worker" : "Add Worker"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
