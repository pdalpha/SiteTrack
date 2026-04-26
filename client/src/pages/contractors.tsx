import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWorkers } from "@/hooks/use-workers";
import type { Contractor, InsertContractor } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Pencil, ToggleLeft, ToggleRight, Users, Calendar, CheckCircle2, Clock3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";

const CHART_COLORS = [
  "hsl(25 85% 48%)", "hsl(183 60% 32%)", "hsl(103 50% 35%)",
  "hsl(43 74% 49%)", "hsl(262 50% 48%)", "hsl(0 72% 45%)",
];

const TERMS_COLORS: Record<string, string> = {
  weekly: "hsl(103 50% 35%)",
  biweekly: "hsl(43 74% 49%)",
  monthly: "hsl(25 85% 48%)",
};

const emptyForm = {
  name: "",
  companyName: "",
  phone: "",
  gstNumber: "",
  paymentTerms: "monthly" as "weekly" | "biweekly" | "monthly",
  bankAccount: "",
  ifscCode: "",
  address: "",
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

export default function ContractorsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContractor, setEditContractor] = useState<Contractor | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: contractors = [], isLoading } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
    queryFn: async () => {
      const res = await fetch("./api/contractors");
      return res.json();
    },
  });

  const { data: allWorkers = [] } = useWorkers();

  const workerCountForContractor = (contractorId: number) =>
    allWorkers.filter(w => w.contractorId === contractorId && w.status === "active").length;

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertContractor>) => {
      const res = await apiRequest("api/contractors", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      closeDialog();
      toast({ title: editContractor ? "Contractor updated" : "Contractor added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertContractor> }) => {
      const res = await apiRequest(`api/contractors/${id}`, { method: "PUT", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      closeDialog();
      toast({ title: "Contractor updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditContractor(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (c: Contractor) => {
    setEditContractor(c);
    setForm({
      name: c.name, companyName: c.companyName ?? "", phone: c.phone ?? "",
      gstNumber: c.gstNumber ?? "", paymentTerms: c.paymentTerms ?? "monthly",
      bankAccount: c.bankAccount ?? "", ifscCode: c.ifscCode ?? "",
      address: c.address ?? "", status: c.status,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditContractor(null); };

  const handleSubmit = () => {
    if (!form.name) return;
    const payload = {
      ...form,
      companyName: form.companyName || null, phone: form.phone || null,
      gstNumber: form.gstNumber || null, bankAccount: form.bankAccount || null,
      ifscCode: form.ifscCode || null, address: form.address || null,
    };
    if (editContractor) { updateMutation.mutate({ id: editContractor.id, data: payload }); }
    else { createMutation.mutate(payload); }
  };

  const toggleStatus = (c: Contractor) => {
    updateMutation.mutate({ id: c.id, data: { status: c.status === "active" ? "inactive" : "active" } });
  };

  const filtered = statusFilter === "all" ? contractors : contractors.filter(c => c.status === statusFilter);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const activeContractors = contractors.filter(c => c.status === "active");
  const totalActiveWorkers = allWorkers.filter(w => w.status === "active").length;

  // Chart data
  const workerDistData = contractors
    .map(c => ({
      name: c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
      workers: workerCountForContractor(c.id),
    }))
    .filter(d => d.workers > 0)
    .sort((a, b) => b.workers - a.workers);

  const termsPieData = ["weekly", "biweekly", "monthly"].map(t => ({
    name: t.charAt(0).toUpperCase() + t.slice(1),
    value: contractors.filter(c => (c.paymentTerms ?? "monthly") === t).length,
    color: TERMS_COLORS[t],
  })).filter(d => d.value > 0);

  const statusPieData = [
    { name: "Active", value: activeContractors.length, color: "hsl(103 50% 35%)" },
    { name: "Inactive", value: contractors.filter(c => c.status === "inactive").length, color: "hsl(0 0% 60%)" },
  ].filter(d => d.value > 0);

  const showCharts = contractors.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Contractors</h1>
          <p className="text-sm text-muted-foreground">{contractors.length} contractors registered</p>
        </div>
        <Button onClick={openAdd} data-testid="button-add-contractor">
          <Briefcase className="w-4 h-4 mr-1" /> Add Contractor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Contractors", value: contractors.length, icon: Briefcase },
          { label: "Active", value: activeContractors.length, icon: CheckCircle2 },
          { label: "Workers Managed", value: totalActiveWorkers, icon: Users },
          { label: "Monthly Pay Terms", value: contractors.filter(c => c.paymentTerms === "monthly").length, icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-xl font-bold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Workers per Contractor Bar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Workers per Contractor</CardTitle>
            </CardHeader>
            <CardContent>
              {workerDistData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={workerDistData} barSize={32}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="workers" name="Workers" radius={[4, 4, 0, 0]}>
                      {workerDistData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  Assign workers to contractors to see distribution
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Terms Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payment Terms Split</CardTitle>
            </CardHeader>
            <CardContent>
              {termsPieData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={termsPieData} cx="50%" cy="50%"
                        innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                        {termsPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-1">
                    {termsPieData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-12 text-center">No data</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2">
        {["all", "active", "inactive"].map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "secondary"}
            onClick={() => setStatusFilter(s)} data-testid={`filter-status-${s}`}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No contractors found. Add your first contractor.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contractor Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Workers</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id} data-testid={`row-contractor-${c.id}`}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.companyName ?? "—"}</TableCell>
                      <TableCell className="tabular-nums text-sm">{c.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="tabular-nums">
                          {workerCountForContractor(c.id)} active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs"
                          style={{ borderColor: TERMS_COLORS[c.paymentTerms ?? "monthly"] + "60" }}>
                          {c.paymentTerms ?? "monthly"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={c.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 text-xs"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(c)} data-testid={`button-edit-contractor-${c.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleStatus(c)} data-testid={`button-toggle-contractor-${c.id}`}>
                            {c.status === "active"
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editContractor ? "Edit Contractor" : "Add Contractor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contractor Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Suresh Patil" data-testid="input-contractor-name" />
              </div>
              <div>
                <Label>Company Name</Label>
                <Input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Patil Contractors" />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210" inputMode="numeric" />
              </div>
              <div>
                <Label>GST Number</Label>
                <Input value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })}
                  placeholder="27AAPFU0939F1ZV" />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Select value={form.paymentTerms} onValueChange={v => setForm({ ...form, paymentTerms: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
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
              <div>
                <Label>Bank Account</Label>
                <Input value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })}
                  placeholder="Account number" />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value })}
                  placeholder="SBIN0001234" />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address..." rows={2} />
              </div>
            </div>
            <Button className="w-full" disabled={!form.name || isPending} onClick={handleSubmit} data-testid="button-submit-contractor">
              {isPending ? "Saving..." : editContractor ? "Update Contractor" : "Add Contractor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
