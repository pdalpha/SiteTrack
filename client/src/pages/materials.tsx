import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSiteSelector } from "@/hooks/use-sites";
import type { Material, InsertMaterial } from "@shared/schema";
import { MATERIAL_UNITS, MATERIAL_UNIT_LABELS } from "@shared/schema";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Plus, Pencil, Trash2, PackageOpen, AlertTriangle, Download } from "lucide-react";
import { downloadCSV } from "@/lib/export-utils";

const emptyForm = {
  name: "",
  unit: "bags" as typeof MATERIAL_UNITS[number],
  quantity: 0,
  threshold: 0,
  supplierName: "",
  notes: "",
};

export default function MaterialsPage() {
  const { toast } = useToast();
  const { sites, selectedSiteId, setSelectedSiteId } = useSiteSelector();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials", selectedSiteId],
    queryFn: async () => {
      const siteParam = selectedSiteId ? `?site_id=${selectedSiteId}` : "";
      const res = await fetch(`./api/materials${siteParam}`, { credentials: "include" });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertMaterial>) => {
      const res = await apiRequest("api/materials", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      setDialogOpen(false);
      setForm({ ...emptyForm });
      toast({ title: "Material added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMaterial> }) => {
      const res = await apiRequest(`api/materials/${id}`, { method: "PUT", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      setDialogOpen(false);
      setEditMaterial(null);
      setForm({ ...emptyForm });
      toast({ title: "Material updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`api/materials/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      setDeleteId(null);
      toast({ title: "Material deleted" });
    },
  });

  const openAdd = () => { setEditMaterial(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (m: Material) => {
    setEditMaterial(m);
    setForm({
      name: m.name,
      unit: m.unit as typeof MATERIAL_UNITS[number],
      quantity: m.quantity,
      threshold: m.threshold,
      supplierName: m.supplierName ?? "",
      notes: m.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !selectedSiteId) return;
    const payload = { ...form, siteId: selectedSiteId, supplierName: form.supplierName || null, notes: form.notes || null };
    if (editMaterial) updateMutation.mutate({ id: editMaterial.id, data: payload });
    else createMutation.mutate(payload);
  };

  const lowStock = materials.filter(m => m.quantity <= m.threshold);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Materials & Inventory</h1>
          <p className="text-sm text-muted-foreground">Track cement, steel, sand and all site materials</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCSV(materials.map(m => ({
            Name: m.name,
            Quantity: m.quantity,
            Unit: MATERIAL_UNIT_LABELS[m.unit] || m.unit,
            Threshold: m.threshold,
            Supplier: m.supplierName ?? "",
            Notes: m.notes ?? "",
          })), `materials_export_${new Date().toISOString().slice(0,10)}.csv`)} disabled={!materials.length}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" onClick={openAdd} disabled={!selectedSiteId}>
            <Plus className="w-4 h-4 mr-1" /> Add Material
          </Button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-orange-700 dark:text-orange-400">{lowStock.length} item(s) low on stock:</span>{" "}
              <span className="text-orange-600 dark:text-orange-300">{lowStock.map(m => m.name).join(", ")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Select value={selectedSiteId?.toString() ?? ""} onValueChange={(v) => setSelectedSiteId(Number(v))}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select Site" /></SelectTrigger>
          <SelectContent>
            {sites.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <PackageOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No materials tracked yet.</p>
            <p className="text-xs mt-1">Select a site and click "Add Material" to start tracking inventory.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.quantity}</TableCell>
                  <TableCell>{MATERIAL_UNIT_LABELS[m.unit] || m.unit}</TableCell>
                  <TableCell>{m.threshold}</TableCell>
                  <TableCell>
                    {m.quantity <= m.threshold ? (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">Low Stock</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(m.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editMaterial ? "Edit Material" : "Add Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Material Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. OPC Cement 43 Grade" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as typeof MATERIAL_UNITS[number] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATERIAL_UNITS.map((u) => <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alert Below</Label>
                <Input type="number" min={0} value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Supplier Name</Label>
              <Input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} placeholder="e.g. UltraTech Cement Ltd" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editMaterial ? "Update" : "Add Material"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete material?"
        description="This will permanently remove the material from inventory."
      />
    </div>
  );
}
