import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSiteSelector } from "@/hooks/use-sites";
import { useAuth } from "@/hooks/use-auth";
import type { Expense, InsertExpense } from "@shared/schema";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, X, ImageIcon, Download } from "lucide-react";
import { downloadCSV } from "@/lib/export-utils";
import { useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const categoryIcons: Record<string, string> = {
  labour: "👷", material: "🧱", equipment: "⚙️", transport: "🚛", food: "🍱", misc: "📦",
};

const paymentBadge: Record<string, { label: string; className: string }> = {
  cash: { label: "Cash", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  upi: { label: "UPI", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  bank: { label: "Bank", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
};

const CHART_COLORS = ["hsl(25 85% 48%)", "hsl(183 60% 32%)", "hsl(103 50% 35%)", "hsl(43 74% 49%)", "hsl(262 50% 48%)", "hsl(0 72% 45%)"];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function PhotoUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPEG, PNG, WebP, GIF allowed", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        try {
          const res = await apiRequest("api/upload/photo", {
            method: "POST",
            body: JSON.stringify({ dataUrl }),
          });
          const { url } = await res.json();
          onChange(url);
        } catch (err: any) {
          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Bill Photo</Label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Bill" className="h-24 w-24 object-cover rounded-md border" />
          <button
            type="button"
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
            onClick={() => onChange("")}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-md text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          data-testid="button-upload-bill-photo"
        >
          {uploading ? (
            <><Upload className="w-4 h-4 animate-pulse" /> Uploading...</>
          ) : (
            <><ImageIcon className="w-4 h-4" /> Upload Bill Photo</>
          )}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

export default function ExpensesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, selectedSiteId, setSelectedSiteId } = useSiteSelector();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category: "material" as typeof EXPENSE_CATEGORIES[number],
    amount: "",
    vendorName: "",
    paymentMode: "cash" as "cash" | "upi" | "bank",
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: "",
    billPhoto: "",
  });

  const { data: monthExpenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses/month", selectedSiteId, month],
    queryFn: async () => {
      if (!selectedSiteId) return [];
      const res = await fetch(`./api/expenses/month?site_id=${selectedSiteId}&month=${month}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedSiteId,
  });

  const { data: summary = [] } = useQuery<{ category: string; total: number }[]>({
    queryKey: ["/api/expenses/summary", selectedSiteId, month],
    queryFn: async () => {
      if (!selectedSiteId) return [];
      const res = await fetch(`./api/expenses/summary?site_id=${selectedSiteId}&month=${month}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedSiteId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertExpense>) => {
      const res = await apiRequest("api/expenses", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setOpen(false);
      setForm({ category: "material", amount: "", vendorName: "", paymentMode: "cash", expenseDate: new Date().toISOString().slice(0, 10), notes: "", billPhoto: "" });
      toast({ title: "Expense added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`api/expenses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense deleted" });
    },
  });

  const filtered = categoryFilter === "all"
    ? monthExpenses
    : monthExpenses.filter((e) => e.category === categoryFilter);

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const chartData = summary.map((s) => ({
    name: EXPENSE_CATEGORY_LABELS[s.category as keyof typeof EXPENSE_CATEGORY_LABELS] || s.category,
    amount: s.total,
  }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track site expenditures</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCSV(filtered.map(e => ({
            Date: e.expenseDate,
            Category: EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] || e.category,
            Amount: e.amount,
            Vendor: e.vendorName ?? "",
            PaymentMode: e.paymentMode,
            Notes: e.notes ?? "",
          })), `expenses_export_${month}.csv`)} disabled={!filtered.length}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense"><Plus className="w-4 h-4 mr-1" /> Add Expense</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as any })}>
                  <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{categoryIcons[c]} {EXPENSE_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₹) <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" data-testid="input-amount" min="0" />
              </div>
              <div>
                <Label>Vendor Name</Label>
                <Input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} placeholder="e.g. Ambuja Cement Dealer" data-testid="input-vendor" />
              </div>
              <div>
                <Label>Payment Mode</Label>
                <Select value={form.paymentMode} onValueChange={(v) => setForm({ ...form, paymentMode: v as any })}>
                  <SelectTrigger data-testid="select-payment-mode"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} data-testid="input-expense-date" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." rows={2} data-testid="input-notes" />
              </div>
              <PhotoUploadField value={form.billPhoto} onChange={(url) => setForm({ ...form, billPhoto: url })} />
              <Button
                className="w-full"
                disabled={!form.amount || !selectedSiteId || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    siteId: selectedSiteId!,
                    category: form.category,
                    amount: Number(form.amount),
                    vendorName: form.vendorName || null,
                    paymentMode: form.paymentMode,
                    expenseDate: form.expenseDate,
                    notes: form.notes || null,
                    billPhoto: form.billPhoto || null,
                    addedBy: user?.id ?? null,
                  })
                }
                data-testid="button-submit-expense"
              >
                {createMutation.isPending ? "Saving..." : "Add Expense"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedSiteId?.toString() ?? ""} onValueChange={(v) => setSelectedSiteId(Number(v))}>
          <SelectTrigger className="w-[200px]" data-testid="select-site"><SelectValue placeholder="Select Site" /></SelectTrigger>
          <SelectContent>
            {sites.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[170px]" data-testid="input-month" />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={categoryFilter === "all" ? "default" : "secondary"} onClick={() => setCategoryFilter("all")} data-testid="filter-all">All</Button>
        {EXPENSE_CATEGORIES.map((c) => (
          <Button key={c} size="sm" variant={categoryFilter === c ? "default" : "secondary"} onClick={() => setCategoryFilter(c)} data-testid={`filter-${c}`}>
            {categoryIcons[c]} {EXPENSE_CATEGORY_LABELS[c]}
          </Button>
        ))}
      </div>

      {/* Total & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total This Month</p>
            <p className="text-2xl font-bold tabular-nums" data-testid="text-total-spent">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{monthExpenses.length} transactions</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base font-medium">By Category</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Amount"]} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {selectedSiteId ? "No expenses for this period" : "Select a site to view expenses"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Bill</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id} data-testid={`row-expense-${e.id}`}>
                      <TableCell className="tabular-nums text-sm">
                        {new Date(e.expenseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{categoryIcons[e.category]} {EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS]}</span>
                      </TableCell>
                      <TableCell className="text-sm">{e.vendorName || "—"}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">₹{e.amount.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge className={`${paymentBadge[e.paymentMode]?.className} text-xs`}>{paymentBadge[e.paymentMode]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{e.notes || "—"}</TableCell>
                      <TableCell>
                        {e.billPhoto ? (
                          <a href={e.billPhoto} target="_blank" rel="noopener noreferrer">
                            <img src={e.billPhoto} alt="Bill" className="h-8 w-8 object-cover rounded border" />
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <ConfirmDialog
                          title="Delete expense?"
                          description={`Delete ₹${e.amount} ${e.category} expense?`}
                          onConfirm={() => deleteMutation.mutate(e.id)}
                          isPending={deleteMutation.isPending}
                          trigger={
                            <Button size="icon" variant="ghost" data-testid={`button-delete-expense-${e.id}`}>
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
