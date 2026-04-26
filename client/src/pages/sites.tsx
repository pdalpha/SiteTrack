import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Site, InsertSite } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Calendar, Building2, Pencil, Trash2, Info } from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

type SiteForm = { name: string; clientName: string; location: string; startDate: string; status: "active" | "completed" | "paused" };
const defaultForm: SiteForm = { name: "", clientName: "", location: "", startDate: "", status: "active" };

function SiteFormFields({ form, setForm }: { form: SiteForm; setForm: (f: SiteForm) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Site Name <span className="text-destructive">*</span></Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Greenfield Residency"
          data-testid="input-site-name"
        />
      </div>
      <div>
        <Label>Client Name <span className="text-destructive">*</span></Label>
        <Input
          value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          placeholder="e.g. Sharma Builders"
          data-testid="input-client-name"
        />
      </div>
      <div>
        <Label>Location</Label>
        <Input
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. CIDCO, Sambhajinagar"
          data-testid="input-location"
        />
      </div>
      <div>
        <Label>Start Date</Label>
        <Input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          data-testid="input-start-date"
        />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SiteForm["status"] })}>
          <SelectTrigger data-testid="select-site-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function SitesPage() {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [detailSite, setDetailSite] = useState<Site | null>(null);
  const [form, setForm] = useState<SiteForm>(defaultForm);
  const [editForm, setEditForm] = useState<SiteForm>(defaultForm);

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertSite>) => {
      const res = await apiRequest("api/sites", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      setAddOpen(false);
      setForm(defaultForm);
      toast({ title: "Site created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSite> }) => {
      const res = await apiRequest(`api/sites/${id}`, { method: "PUT", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      setEditSite(null);
      toast({ title: "Site updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`api/sites/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({ title: "Site deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest(`api/sites/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({ title: "Status updated" });
    },
  });

  const openEdit = (site: Site) => {
    setEditForm({ name: site.name, clientName: site.clientName, location: site.location || "", startDate: site.startDate || "", status: site.status });
    setEditSite(site);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Sites</h1>
          <p className="text-sm text-muted-foreground">{sites.length} total sites</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-site">
              <Plus className="w-4 h-4 mr-1" /> Add Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Construction Site</DialogTitle></DialogHeader>
            <SiteFormFields form={form} setForm={setForm} />
            <Button
              className="w-full mt-2"
              disabled={!form.name || !form.clientName || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}
              data-testid="button-submit-site"
            >
              {createMutation.isPending ? "Creating..." : "Create Site"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-24" />
            </CardContent></Card>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No sites yet. Create your first site.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <Card key={site.id} data-testid={`card-site-${site.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{site.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{site.clientName}</span>
                    </p>
                  </div>
                  <Badge className={`${statusColors[site.status]} text-xs flex-shrink-0`}>
                    {site.status}
                  </Badge>
                </div>
                {site.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{site.location}</span>
                  </p>
                )}
                {site.startDate && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    Started {new Date(site.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {site.status !== "active" && (
                    <Button size="sm" variant="secondary" onClick={() => statusMutation.mutate({ id: site.id, status: "active" })}>
                      Activate
                    </Button>
                  )}
                  {site.status === "active" && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => statusMutation.mutate({ id: site.id, status: "paused" })}>Pause</Button>
                      <Button size="sm" variant="secondary" onClick={() => statusMutation.mutate({ id: site.id, status: "completed" })}>Complete</Button>
                    </>
                  )}
                  <Button size="icon" variant="ghost" className="ml-auto" onClick={() => setDetailSite(site)} data-testid={`button-details-${site.id}`}>
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(site)} data-testid={`button-edit-site-${site.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <ConfirmDialog
                    title={`Delete "${site.name}"?`}
                    description="This will permanently delete the site. Related records (attendance, DPR, expenses) will remain in the database."
                    onConfirm={() => deleteMutation.mutate(site.id)}
                    isPending={deleteMutation.isPending}
                    trigger={
                      <Button size="icon" variant="ghost" data-testid={`button-delete-site-${site.id}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editSite} onOpenChange={(o) => { if (!o) setEditSite(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Site</DialogTitle></DialogHeader>
          <SiteFormFields form={editForm} setForm={setEditForm} />
          <Button
            className="w-full mt-2"
            disabled={!editForm.name || !editForm.clientName || updateMutation.isPending}
            onClick={() => editSite && updateMutation.mutate({ id: editSite.id, data: editForm })}
            data-testid="button-update-site"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!detailSite} onOpenChange={(o) => { if (!o) setDetailSite(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Site Details</DialogTitle></DialogHeader>
          {detailSite && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground text-xs">Site Name</p><p className="font-medium">{detailSite.name}</p></div>
                <div><p className="text-muted-foreground text-xs">Client</p><p className="font-medium">{detailSite.clientName}</p></div>
                <div><p className="text-muted-foreground text-xs">Location</p><p>{detailSite.location || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p>
                  <Badge className={`${statusColors[detailSite.status]} text-xs`}>{detailSite.status}</Badge>
                </div>
                <div><p className="text-muted-foreground text-xs">Start Date</p><p>{detailSite.startDate || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Created</p><p>{new Date(detailSite.createdAt).toLocaleDateString("en-IN")}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
