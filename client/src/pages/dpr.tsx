import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSiteSelector } from "@/hooks/use-sites";
import type { Dpr, InsertDpr } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Users, Wrench, Package, AlertTriangle, MessageSquare, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function DprPage() {
  const { toast } = useToast();
  const { sites, selectedSiteId, setSelectedSiteId } = useSiteSelector();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    workDone: "",
    manpowerCount: 0,
    contractorName: "",
    materialUsed: "",
    machineryUsed: "",
    delayReason: "",
    remarks: "",
  });

  // Fetch DPR for selected site+date
  const { data: currentDpr, isLoading } = useQuery<Dpr | null>({
    queryKey: ["/api/dpr", selectedSiteId, date],
    queryFn: async () => {
      if (!selectedSiteId) return null;
      const res = await fetch(`./api/dpr?site_id=${selectedSiteId}&date=${date}`);
      return res.json();
    },
    enabled: !!selectedSiteId,
  });

  // Fetch history
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { data: history = [] } = useQuery<Dpr[]>({
    queryKey: ["/api/dpr/history", selectedSiteId],
    queryFn: async () => {
      if (!selectedSiteId) return [];
      const res = await fetch(`./api/dpr/history?site_id=${selectedSiteId}&from=${thirtyDaysAgo}&to=${date}`);
      return res.json();
    },
    enabled: !!selectedSiteId,
  });

  // Populate form when DPR loads
  useEffect(() => {
    if (currentDpr) {
      setForm({
        workDone: currentDpr.workDone || "",
        manpowerCount: currentDpr.manpowerCount || 0,
        contractorName: currentDpr.contractorName || "",
        materialUsed: currentDpr.materialUsed || "",
        machineryUsed: currentDpr.machineryUsed || "",
        delayReason: currentDpr.delayReason || "",
        remarks: currentDpr.remarks || "",
      });
      setEditing(false);
    } else {
      setForm({ workDone: "", manpowerCount: 0, contractorName: "", materialUsed: "", machineryUsed: "", delayReason: "", remarks: "" });
      setEditing(true);
    }
  }, [currentDpr]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("api/dpr", {
        method: "POST",
        body: JSON.stringify({
          siteId: selectedSiteId,
          date,
          ...form,
          manpowerCount: Number(form.manpowerCount) || null,
          contractorName: form.contractorName || null,
          materialUsed: form.materialUsed || null,
          machineryUsed: form.machineryUsed || null,
          delayReason: form.delayReason || null,
          remarks: form.remarks || null,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dpr"] });
      toast({ title: "DPR submitted" });
      setEditing(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!currentDpr) return;
      const res = await apiRequest(`api/dpr/${currentDpr.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          manpowerCount: Number(form.manpowerCount) || null,
          contractorName: form.contractorName || null,
          materialUsed: form.materialUsed || null,
          machineryUsed: form.machineryUsed || null,
          delayReason: form.delayReason || null,
          remarks: form.remarks || null,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dpr"] });
      toast({ title: "DPR updated" });
      setEditing(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (currentDpr) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Daily Progress Report</h1>
          <p className="text-sm text-muted-foreground">One report per site per day</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedSiteId?.toString() ?? ""} onValueChange={(v) => setSelectedSiteId(Number(v))}>
          <SelectTrigger className="w-[200px]" data-testid="select-site">
            <SelectValue placeholder="Select Site" />
          </SelectTrigger>
          <SelectContent>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-[170px]"
          data-testid="input-date"
        />
        {currentDpr && !editing && (
          <Button variant="secondary" onClick={() => setEditing(true)} data-testid="button-edit-dpr">
            Edit
          </Button>
        )}
      </div>

      <Tabs defaultValue="form">
        <TabsList>
          <TabsTrigger value="form" data-testid="tab-form">
            {currentDpr ? "View / Edit" : "New Report"}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">History ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="mt-4">
          {isLoading ? (
            <Card><CardContent className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
          ) : !selectedSiteId ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Select a site to view or create DPR</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-4">
                {currentDpr && !editing && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Submitted
                  </Badge>
                )}

                <div>
                  <Label className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5" /> Work Done Today
                  </Label>
                  <Textarea
                    value={form.workDone}
                    onChange={(e) => setForm({ ...form, workDone: e.target.value })}
                    placeholder="Describe work completed today..."
                    rows={3}
                    disabled={!editing}
                    data-testid="input-work-done"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1.5">
                      <Users className="w-3.5 h-3.5" /> Manpower Count
                    </Label>
                    <Input
                      type="number"
                      value={form.manpowerCount || ""}
                      onChange={(e) => setForm({ ...form, manpowerCount: Number(e.target.value) })}
                      disabled={!editing}
                      data-testid="input-manpower"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1.5">
                      <Users className="w-3.5 h-3.5" /> Contractor Name
                    </Label>
                    <Input
                      value={form.contractorName}
                      onChange={(e) => setForm({ ...form, contractorName: e.target.value })}
                      disabled={!editing}
                      data-testid="input-contractor"
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-1.5 mb-1.5">
                    <Package className="w-3.5 h-3.5" /> Material Used
                  </Label>
                  <Textarea
                    value={form.materialUsed}
                    onChange={(e) => setForm({ ...form, materialUsed: e.target.value })}
                    rows={2}
                    disabled={!editing}
                    data-testid="input-material"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-1.5 mb-1.5">
                    <Wrench className="w-3.5 h-3.5" /> Machinery Used
                  </Label>
                  <Input
                    value={form.machineryUsed}
                    onChange={(e) => setForm({ ...form, machineryUsed: e.target.value })}
                    disabled={!editing}
                    data-testid="input-machinery"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Delay / Issues
                  </Label>
                  <Textarea
                    value={form.delayReason}
                    onChange={(e) => setForm({ ...form, delayReason: e.target.value })}
                    rows={2}
                    disabled={!editing}
                    data-testid="input-delay"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-1.5 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Remarks
                  </Label>
                  <Textarea
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    rows={2}
                    disabled={!editing}
                    data-testid="input-remarks"
                  />
                </div>

                {editing && (
                  <Button
                    className="w-full"
                    disabled={!form.workDone || createMutation.isPending || updateMutation.isPending}
                    onClick={handleSubmit}
                    data-testid="button-submit-dpr"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : currentDpr
                        ? "Update Report"
                        : "Submit Report"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {history.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No reports in the last 30 days</CardContent></Card>
          ) : (
            history.map((d) => (
              <Card key={d.id} data-testid={`card-dpr-${d.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {d.manpowerCount && (
                      <Badge variant="secondary" className="text-xs">{d.manpowerCount} workers</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{d.workDone}</p>
                  {d.contractorName && (
                    <p className="text-xs text-muted-foreground mt-1">Contractor: {d.contractorName}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
