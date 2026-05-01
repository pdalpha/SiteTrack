import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSiteSelector } from "@/hooks/use-sites";
import type { Issue, InsertIssue } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle, Clock, MapPin } from "lucide-react";

const priorityConfig: Record<string, { label: string; color: string; badge: string }> = {
  low: { label: "Low", color: "text-blue-600", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  medium: { label: "Medium", color: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  high: { label: "High", color: "text-orange-600", badge: "bg-orange-100 text-orange-700 border-orange-200" },
  critical: { label: "Critical", color: "text-red-600", badge: "bg-red-100 text-red-700 border-red-200" },
};

const statusConfig: Record<string, { label: string; icon: any; badge: string }> = {
  open: { label: "Open", icon: AlertTriangle, badge: "bg-red-100 text-red-700 border-red-200" },
  in_progress: { label: "In Progress", icon: Clock, badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  resolved: { label: "Resolved", icon: CheckCircle, badge: "bg-green-100 text-green-700 border-green-200" },
};

const emptyForm = {
  title: "",
  description: "",
  priority: "medium" as "low" | "medium" | "high" | "critical",
  status: "open" as "open" | "in_progress" | "resolved",
  assignedTo: "",
};

export default function IssuesPage() {
  const { toast } = useToast();
  const { sites, selectedSiteId, setSelectedSiteId } = useSiteSelector();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues", selectedSiteId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSiteId) params.set("site_id", String(selectedSiteId));
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`./api/issues?${params.toString()}`, { credentials: "include" });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertIssue>) => {
      const res = await apiRequest("api/issues", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      setDialogOpen(false);
      setForm({ ...emptyForm });
      toast({ title: "Issue logged" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertIssue> }) => {
      const res = await apiRequest(`api/issues/${id}`, { method: "PUT", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      setDialogOpen(false);
      setEditIssue(null);
      setForm({ ...emptyForm });
      toast({ title: "Issue updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`api/issues/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      setDeleteId(null);
      toast({ title: "Issue deleted" });
    },
  });

  const openAdd = () => { setEditIssue(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (i: Issue) => {
    setEditIssue(i);
    setForm({
      title: i.title,
      description: i.description ?? "",
      priority: i.priority as any,
      status: i.status as any,
      assignedTo: i.assignedTo ?? "",
    });
    setDialogOpen(true);
  };

  const quickStatusChange = (id: number, newStatus: string) => {
    updateMutation.mutate({ id, data: { status: newStatus as any } });
  };

  const handleSubmit = () => {
    if (!form.title || !selectedSiteId) return;
    const payload = { ...form, siteId: selectedSiteId, description: form.description || null, assignedTo: form.assignedTo || null };
    if (editIssue) updateMutation.mutate({ id: editIssue.id, data: payload });
    else createMutation.mutate(payload);
  };

  const openCount = issues.filter((i) => i.status !== "resolved").length;
  const criticalCount = issues.filter((i) => i.priority === "critical" && i.status !== "resolved").length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Issues & Punch List</h1>
          <p className="text-sm text-muted-foreground">
            {openCount} open {criticalCount > 0 && <span className="text-red-600 font-medium">({criticalCount} critical)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openAdd} disabled={!selectedSiteId}>
            <Plus className="w-4 h-4 mr-1" /> Log Issue
          </Button>
        </div>
      </div>

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
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No issues logged.</p>
            <p className="text-xs mt-1">Select a site and click "Log Issue" to start tracking site problems.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const p = priorityConfig[issue.priority] || priorityConfig.medium;
            const s = statusConfig[issue.status] || statusConfig.open;
            const StatusIcon = s.icon;
            return (
              <Card key={issue.id} className={issue.status === "resolved" ? "opacity-70" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={p.badge}>{p.label}</Badge>
                        <Badge variant="secondary" className={s.badge}><StatusIcon className="w-3 h-3 mr-1" />{s.label}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{issue.title}</h3>
                      {issue.description && <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>}
                      {issue.assignedTo && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Assigned: {issue.assignedTo}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {issue.status !== "resolved" && (
                        <Button size="sm" variant="outline" onClick={() => quickStatusChange(issue.id, "resolved")}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Resolve
                        </Button>
                      )}
                      {issue.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => quickStatusChange(issue.id, "in_progress")}>
                          <Clock className="w-3.5 h-3.5 mr-1" /> Start
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => openEdit(issue)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(issue.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editIssue ? "Edit Issue" : "Log New Issue"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Water leakage in basement" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the issue and its impact..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Assigned To</Label>
              <Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} placeholder="e.g. Site Engineer Rajesh" />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!form.title || createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editIssue ? "Update" : "Log Issue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete issue?"
        description="This will permanently remove the issue from the punch list."
      />
    </div>
  );
}
