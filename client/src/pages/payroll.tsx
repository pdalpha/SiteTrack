import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSites } from "@/hooks/use-sites";
import { useWorkers } from "@/hooks/use-workers";
import type { Worker } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Users, Wallet, Clock, TrendingDown, IndianRupee, Download, Printer, RefreshCw, Plus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line,
} from "recharts";

const CHART_COLORS = [
  "hsl(25 85% 48%)", "hsl(183 60% 32%)", "hsl(103 50% 35%)",
  "hsl(43 74% 49%)", "hsl(262 50% 48%)", "hsl(0 72% 45%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg px-3 py-2 text-sm shadow-md">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>
          {p.name}: <span className="font-semibold">₹{Number(p.value).toLocaleString("en-IN")}</span>
        </p>
      ))}
    </div>
  );
};

// Months list helper
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return d.toISOString().slice(0, 7);
});

type EnrichedPayroll = {
  id: number;
  workerId: number;
  siteId: number;
  month: string;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  overtimeHours: number;
  advance: number;
  deduction: number;
  grossSalary: number;
  netSalary: number;
  status: "pending" | "paid";
  workerName: string;
  siteName: string;
};

export default function PayrollPage() {
  const { toast } = useToast();
  const { sites } = useSites() as any;
  const { data: siteList = [] } = useQuery({ queryKey: ["/api/sites"], queryFn: async () => { const r = await fetch("./api/sites"); return r.json(); } });
  const { data: allWorkers = [] } = useWorkers();

  const today = new Date().toISOString().slice(0, 7);
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(today);
  const [workerFilter, setWorkerFilter] = useState<string>("all");

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<EnrichedPayroll | null>(null);
  const [editForm, setEditForm] = useState({ overtimeHours: 0, advance: 0, deduction: 0, status: "pending" as "pending" | "paid" });

  // Advance dialog state
  const [advOpen, setAdvOpen] = useState(false);
  const [advForm, setAdvForm] = useState({ workerId: 0, amount: 0, date: today, note: "" });

  // Payslip print state
  const [printRow, setPrintRow] = useState<EnrichedPayroll | null>(null);

  const payrollQuery = useQuery<EnrichedPayroll[]>({
    queryKey: ["/api/payroll", selectedSite, selectedMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSite !== "all") params.set("site_id", selectedSite);
      if (selectedMonth) params.set("month", selectedMonth);
      const res = await fetch(`./api/payroll?${params}`);
      return res.json();
    },
  });
  const rows: EnrichedPayroll[] = payrollQuery.data ?? [];

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (selectedSite === "all") throw new Error("Please select a site to generate payroll");
      const res = await apiRequest("api/payroll/generate", { method: "POST", body: JSON.stringify({ site_id: Number(selectedSite), month: selectedMonth }) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      toast({ title: "Payroll generated", description: `Payroll calculated for ${selectedMonth}` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      // Recalculate net salary
      const row = rows.find(r => r.id === id);
      if (row) {
        const netSalary = Math.max(0, row.grossSalary + (data.overtimeHours ?? 0) * 0 - (data.advance ?? row.advance) - (data.deduction ?? row.deduction));
        data.netSalary = Math.round(netSalary * 100) / 100;
      }
      const res = await apiRequest(`api/payroll/${id}`, { method: "PUT", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      setEditOpen(false);
      toast({ title: "Payroll row updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const advanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("api/advances", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      setAdvOpen(false);
      toast({ title: "Advance recorded" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (row: EnrichedPayroll) => {
    setEditRow(row);
    setEditForm({ overtimeHours: row.overtimeHours, advance: row.advance, deduction: row.deduction, status: row.status });
    setEditOpen(true);
  };

  const handlePrint = (row: EnrichedPayroll) => {
    setPrintRow(row);
    setTimeout(() => window.print(), 300);
  };

  const exportCSV = () => {
    const params = new URLSearchParams({ format: "csv" });
    if (selectedSite !== "all") params.set("site_id", selectedSite);
    if (selectedMonth) params.set("month", selectedMonth);
    window.open(`./api/payroll/report?${params}`);
  };

  const filtered = rows.filter(r => workerFilter === "all" || String(r.workerId) === workerFilter);

  // Summary totals
  const totalWorkers = filtered.length;
  const totalLabour = filtered.reduce((s, r) => s + r.grossSalary, 0);
  const totalOT = filtered.reduce((s, r) => s + r.overtimeHours, 0);
  const totalAdvances = filtered.reduce((s, r) => s + r.advance, 0);
  const netPayroll = filtered.reduce((s, r) => s + r.netSalary, 0);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Printable Payslip (hidden, shown on print) */}
      {printRow && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-50">
          <div className="max-w-md mx-auto border rounded-lg p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold">SiteTrack — Payslip</h2>
              <p className="text-sm text-gray-500">{printRow.month}</p>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="font-medium">Worker</span><span>{printRow.workerName}</span></div>
              <div className="flex justify-between"><span className="font-medium">Site</span><span>{printRow.siteName}</span></div>
              <div className="flex justify-between"><span className="font-medium">Present Days</span><span>{printRow.presentDays}</span></div>
              <div className="flex justify-between"><span className="font-medium">Half Days</span><span>{printRow.halfDays}</span></div>
              <div className="flex justify-between"><span className="font-medium">Absent Days</span><span>{printRow.absentDays}</span></div>
              <div className="flex justify-between"><span className="font-medium">Overtime Hours</span><span>{printRow.overtimeHours}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="font-medium">Gross Salary</span><span>{fmt(printRow.grossSalary)}</span></div>
              <div className="flex justify-between text-red-600"><span>Advance Deduction</span><span>- {fmt(printRow.advance)}</span></div>
              <div className="flex justify-between text-red-600"><span>Other Deductions</span><span>- {fmt(printRow.deduction)}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-bold"><span>Net Salary</span><span>{fmt(printRow.netSalary)}</span></div>
            </div>
            <div className="text-center text-xs text-gray-400 mt-4">Generated by SiteTrack</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Payroll</h1>
          <p className="text-sm text-muted-foreground">Calculate and manage worker salaries</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setAdvOpen(true)} data-testid="button-record-advance">
            <Plus className="w-4 h-4 mr-1" /> Record Advance
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-payroll">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || selectedSite === "all"} data-testid="button-generate-payroll">
            <RefreshCw className={`w-4 h-4 mr-1 ${generateMutation.isPending ? "animate-spin" : ""}`} />
            {generateMutation.isPending ? "Generating..." : "Generate Payroll"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-[180px]" data-testid="select-payroll-site"><SelectValue placeholder="All Sites" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {siteList.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[150px]" data-testid="select-payroll-month"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={workerFilter} onValueChange={setWorkerFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Workers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workers</SelectItem>
            {allWorkers.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print:hidden">
        {[
          { label: "Total Workers", value: String(totalWorkers), icon: Users },
          { label: "Gross Labour Cost", value: fmt(totalLabour), icon: IndianRupee },
          { label: "Total OT Hours", value: String(totalOT), icon: Clock },
          { label: "Total Advances", value: fmt(totalAdvances), icon: TrendingDown },
          { label: "Net Payroll", value: fmt(netPayroll), icon: Wallet },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-lg font-bold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Charts — shown only when payroll rows exist */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">
          {/* Net Salary per Worker bar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gross vs Net Salary by Worker</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={filtered.map(r => ({
                    name: r.workerName.split(" ")[0],
                    Gross: r.grossSalary,
                    Net: r.netSalary,
                    Deductions: r.advance + r.deduction,
                  }))}
                  barSize={18}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Gross" fill="hsl(183 60% 32%)" radius={[4,4,0,0]} name="Gross" />
                  <Bar dataKey="Net" fill="hsl(103 50% 35%)" radius={[4,4,0,0]} name="Net" />
                  <Bar dataKey="Deductions" fill="hsl(0 72% 45%)" radius={[4,4,0,0]} name="Deductions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Paid vs Pending Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const pieData = [
                  { name: "Paid", value: filtered.filter(r => r.status === "paid").length, color: "hsl(103 50% 35%)" },
                  { name: "Pending", value: filtered.filter(r => r.status === "pending").length, color: "hsl(43 74% 49%)" },
                ].filter(d => d.value > 0);
                const paidAmt = filtered.filter(r => r.status === "paid").reduce((s,r) => s + r.netSalary, 0);
                const pendingAmt = filtered.filter(r => r.status === "pending").reduce((s,r) => s + r.netSalary, 0);
                return (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={62}
                          dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} workers`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full mt-2 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />Paid</span>
                        <span className="font-semibold">₹{paidAmt.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />Pending</span>
                        <span className="font-semibold">₹{pendingAmt.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}


      <Card className="print:hidden">
        <CardContent className="p-0">
          {payrollQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {selectedSite === "all"
                ? "Select a site and click Generate Payroll to calculate salaries."
                : "No payroll data. Click Generate Payroll to calculate from attendance."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Half</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">OT Hrs</TableHead>
                    <TableHead className="text-right">Advance</TableHead>
                    <TableHead className="text-right">Deduction</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(row => (
                    <TableRow key={row.id} data-testid={`row-payroll-${row.id}`}>
                      <TableCell className="font-medium">{row.workerName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.siteName}</TableCell>
                      <TableCell className="text-center tabular-nums">{row.presentDays}</TableCell>
                      <TableCell className="text-center tabular-nums">{row.halfDays}</TableCell>
                      <TableCell className="text-center tabular-nums">{row.absentDays}</TableCell>
                      <TableCell className="text-center tabular-nums">{row.overtimeHours}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{fmt(row.advance)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{fmt(row.deduction)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{fmt(row.netSalary)}</TableCell>
                      <TableCell>
                        <Badge className={row.status === "paid"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(row)} data-testid={`button-edit-payroll-${row.id}`}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => handlePrint(row)} data-testid={`button-print-payslip-${row.id}`}>
                            <Printer className="w-3.5 h-3.5" />
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

      {/* Edit Payroll Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Payroll — {editRow?.workerName}</DialogTitle></DialogHeader>
          {editRow && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Present Days</span><span className="font-medium">{editRow.presentDays}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gross Salary</span><span className="font-medium">{fmt(editRow.grossSalary)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Overtime Hours</Label>
                  <Input type="number" min="0" value={editForm.overtimeHours}
                    onChange={e => setEditForm({ ...editForm, overtimeHours: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Advance Deduction (₹)</Label>
                  <Input type="number" min="0" value={editForm.advance}
                    onChange={e => setEditForm({ ...editForm, advance: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Other Deduction (₹)</Label>
                  <Input type="number" min="0" value={editForm.deduction}
                    onChange={e => setEditForm({ ...editForm, deduction: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-t font-semibold">
                <span>Estimated Net</span>
                <span>{fmt(Math.max(0, editRow.grossSalary - editForm.advance - editForm.deduction))}</span>
              </div>
              <Button className="w-full" disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: editRow.id, data: editForm })}
                data-testid="button-submit-payroll-edit">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Advance Dialog */}
      <Dialog open={advOpen} onOpenChange={setAdvOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Advance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Worker</Label>
              <Select value={String(advForm.workerId || "")} onValueChange={v => setAdvForm({ ...advForm, workerId: Number(v) })}>
                <SelectTrigger data-testid="select-advance-worker"><SelectValue placeholder="Select worker" /></SelectTrigger>
                <SelectContent>
                  {allWorkers.filter(w => w.status === "active").map(w => (
                    <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" min="1" value={advForm.amount}
                  onChange={e => setAdvForm({ ...advForm, amount: Number(e.target.value) })} data-testid="input-advance-amount" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={advForm.date}
                  onChange={e => setAdvForm({ ...advForm, date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Note</Label>
              <Input value={advForm.note} onChange={e => setAdvForm({ ...advForm, note: e.target.value })}
                placeholder="e.g. Emergency advance" data-testid="input-advance-note" />
            </div>
            <Button className="w-full" disabled={!advForm.workerId || advForm.amount <= 0 || advanceMutation.isPending}
              onClick={() => advanceMutation.mutate({ workerId: advForm.workerId, amount: advForm.amount, date: advForm.date, note: advForm.note || null })}
              data-testid="button-submit-advance">
              {advanceMutation.isPending ? "Saving..." : "Record Advance"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
