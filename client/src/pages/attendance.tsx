import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSiteSelector } from "@/hooks/use-sites";
import { useWorkers } from "@/hooks/use-workers";
import { useAuth } from "@/hooks/use-auth";
import type { Attendance, InsertAttendance } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, Users, UserX, Clock, CheckSquare, XSquare } from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  half_day: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const statusLabels: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half Day",
};

const nextStatus: Record<string, "present" | "absent" | "half_day"> = {
  present: "absent",
  absent: "half_day",
  half_day: "present",
};

export default function AttendancePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { sites, selectedSiteId, setSelectedSiteId } = useSiteSelector();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    workerId: null as number | null,
    workerName: "",
    contractorName: "",
    status: "present" as "present" | "absent" | "half_day",
    checkIn: "08:00",
    checkOut: "17:00",
  });

  const { data: siteWorkers = [] } = useWorkers(selectedSiteId, "active");

  const { data: records = [], isLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", selectedSiteId, date],
    queryFn: async () => {
      if (!selectedSiteId) return [];
      const res = await fetch(`./api/attendance?site_id=${selectedSiteId}&date=${date}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!selectedSiteId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertAttendance>) => {
      const res = await apiRequest("api/attendance", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setOpen(false);
      setForm({ workerId: null, workerName: "", contractorName: "", status: "present", checkIn: "08:00", checkOut: "17:00" });
      toast({ title: "Attendance marked" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAttendance> }) => {
      const res = await apiRequest(`api/attendance/${id}`, { method: "PUT", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`api/attendance/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "Record deleted" });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (status: "present" | "absent") => {
      if (!selectedSiteId) return;
      const workerNames = records.length > 0
        ? records.map(r => r.workerName)
        : []; // Only bulk-update existing workers
      if (workerNames.length === 0) return toast({ title: "No workers to update. Add workers first." });
      const bulkRecords = records.map(r => ({
        siteId: r.siteId,
        workerName: r.workerName,
        contractorName: r.contractorName || null,
        date: r.date,
        status,
        checkIn: status === "present" ? "08:00" : null,
        checkOut: status === "present" ? "17:00" : null,
        createdBy: user?.id ?? null,
      }));
      const res = await apiRequest("api/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({ records: bulkRecords }),
      });
      return res.json();
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: `All workers marked ${status}` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = records.filter(
    (r) =>
      r.workerName.toLowerCase().includes(search.toLowerCase()) ||
      (r.contractorName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const halfDay = records.filter((r) => r.status === "half_day").length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Attendance</h1>
          <p className="text-sm text-muted-foreground">Track daily worker attendance</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-attendance">
              <Plus className="w-4 h-4 mr-1" /> Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Worker Name <span className="text-destructive">*</span></Label>
                {siteWorkers.length > 0 ? (
                  <Select
                    value={form.workerId?.toString() ?? ""}
                    onValueChange={(v) => {
                      const w = siteWorkers.find(wk => wk.id === Number(v));
                      setForm({ ...form, workerId: Number(v), workerName: w?.name ?? "", contractorName: form.contractorName });
                    }}
                  >
                    <SelectTrigger data-testid="select-worker-picker">
                      <SelectValue placeholder="Select worker..." />
                    </SelectTrigger>
                    <SelectContent>
                      {siteWorkers.map(w => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={form.workerName}
                    onChange={(e) => setForm({ ...form, workerName: e.target.value })}
                    placeholder="e.g. Raju Kamble"
                    data-testid="input-worker-name"
                  />
                )}
              </div>
              <div>
                <Label>Contractor Name</Label>
                <Input
                  value={form.contractorName}
                  onChange={(e) => setForm({ ...form, contractorName: e.target.value })}
                  placeholder="e.g. Patil Contractors"
                  data-testid="input-contractor-name"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check In</Label>
                  <Input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} data-testid="input-check-in" />
                </div>
                <div>
                  <Label>Check Out</Label>
                  <Input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} data-testid="input-check-out" />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!form.workerName || !selectedSiteId || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    siteId: selectedSiteId!,
                    workerId: form.workerId ?? null,
                    workerName: form.workerName,
                    contractorName: form.contractorName || null,
                    status: form.status,
                    checkIn: form.checkIn || null,
                    checkOut: form.checkOut || null,
                    date,
                    createdBy: user?.id ?? null,
                  })
                }
                data-testid="button-submit-attendance"
              >
                {createMutation.isPending ? "Saving..." : "Mark Attendance"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedSiteId?.toString() ?? ""} onValueChange={(v) => setSelectedSiteId(Number(v))}>
          <SelectTrigger className="w-[200px]" data-testid="select-site">
            <SelectValue placeholder="Select Site" />
          </SelectTrigger>
          <SelectContent>
            {sites.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-[170px]"
          data-testid="input-date"
        />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search worker or contractor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Bulk actions */}
      {records.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            className="text-green-700 border-green-200"
            onClick={() => bulkMutation.mutate("present")}
            disabled={bulkMutation.isPending}
            data-testid="button-mark-all-present"
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Mark All Present
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="text-red-700 border-red-200"
            onClick={() => bulkMutation.mutate("absent")}
            disabled={bulkMutation.isPending}
            data-testid="button-mark-all-absent"
          >
            <XSquare className="w-3.5 h-3.5 mr-1.5" /> Mark All Absent
          </Button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div><p className="text-xs text-muted-foreground">Present</p><p className="text-lg font-bold tabular-nums">{present}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
              <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div><p className="text-xs text-muted-foreground">Absent</p><p className="text-lg font-bold tabular-nums">{absent}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div><p className="text-xs text-muted-foreground">Half Day</p><p className="text-lg font-bold tabular-nums">{halfDay}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {selectedSiteId ? "No attendance records for this date" : "Select a site to view attendance"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} data-testid={`row-attendance-${r.id}`}>
                      <TableCell className="font-medium">{r.workerName}</TableCell>
                      <TableCell className="text-muted-foreground">{r.contractorName || "—"}</TableCell>
                      <TableCell>
                        {/* Click badge to cycle status */}
                        <button
                          onClick={() => updateMutation.mutate({ id: r.id, data: { status: nextStatus[r.status] } })}
                          title="Click to cycle status"
                          data-testid={`badge-status-${r.id}`}
                        >
                          <Badge className={`${statusColors[r.status]} text-xs cursor-pointer`}>
                            {statusLabels[r.status]}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="tabular-nums">{r.checkIn || "—"}</TableCell>
                      <TableCell className="tabular-nums">{r.checkOut || "—"}</TableCell>
                      <TableCell>
                        <ConfirmDialog
                          title="Delete attendance record?"
                          description={`Remove attendance for ${r.workerName} on ${r.date}?`}
                          onConfirm={() => deleteMutation.mutate(r.id)}
                          isPending={deleteMutation.isPending}
                          trigger={
                            <Button size="icon" variant="ghost" data-testid={`button-delete-attendance-${r.id}`}>
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
