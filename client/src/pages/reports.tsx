import { useState } from "react";
import { useSiteSelector } from "@/hooks/use-sites";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, BarChart2, Users, Wallet, FileText } from "lucide-react";
import { EXPENSE_CATEGORY_LABELS } from "@shared/schema";

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  half_day: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

function downloadCSV(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ReportsPage() {
  const { toast } = useToast();
  const { sites, selectedSiteId, setSelectedSiteId } = useSiteSelector();

  // Default date range: last 30 days
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [activeTab, setActiveTab] = useState("attendance");

  const isReady = !!selectedSiteId && !!from && !!to && from <= to;

  // Attendance report
  const { data: attendanceReport, isLoading: attLoading } = useQuery<{
    rows: any[];
    totals: { present: number; absent: number; halfDay: number };
    site: string;
  }>({
    queryKey: ["/api/reports/attendance", selectedSiteId, from, to],
    queryFn: async () => {
      const res = await fetch(
        `./api/reports/attendance?site_id=${selectedSiteId}&from=${from}&to=${to}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load attendance report");
      return res.json();
    },
    enabled: isReady && activeTab === "attendance",
  });

  // Expenses report
  const { data: expenseReport, isLoading: expLoading } = useQuery<{
    rows: any[];
    totalAmount: number;
    byCategory: Record<string, number>;
    site: string;
  }>({
    queryKey: ["/api/reports/expenses", selectedSiteId, from, to],
    queryFn: async () => {
      const res = await fetch(
        `./api/reports/expenses?site_id=${selectedSiteId}&from=${from}&to=${to}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load expenses report");
      return res.json();
    },
    enabled: isReady && activeTab === "expenses",
  });

  // DPR report
  const { data: dprReport, isLoading: dprLoading } = useQuery<{
    rows: any[];
    total: number;
    site: string;
  }>({
    queryKey: ["/api/reports/dpr", selectedSiteId, from, to],
    queryFn: async () => {
      const res = await fetch(
        `./api/reports/dpr?site_id=${selectedSiteId}&from=${from}&to=${to}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load DPR report");
      return res.json();
    },
    enabled: isReady && activeTab === "dpr",
  });

  const handleExportCSV = (type: string) => {
    if (!selectedSiteId || !from || !to) {
      toast({ title: "Select site and date range first", variant: "destructive" });
      return;
    }
    const url = `./api/reports/${type}?site_id=${selectedSiteId}&from=${from}&to=${to}&format=csv`;
    downloadCSV(url, `${type}_report_${from}_${to}.csv`);
    toast({ title: "CSV export started" });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Reports</h1>
          <p className="text-sm text-muted-foreground">Date-range reports with CSV export</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs mb-1 block">Site</Label>
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
        </div>
        <div>
          <Label className="text-xs mb-1 block">From</Label>
          <Input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="w-[160px]"
            data-testid="input-from-date"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">To</Label>
          <Input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className="w-[160px]"
            data-testid="input-to-date"
          />
        </div>
      </div>

      {!selectedSiteId && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Select a site and date range to view reports</p>
          </CardContent>
        </Card>
      )}

      {selectedSiteId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="expenses" data-testid="tab-expenses">
              <Wallet className="w-3.5 h-3.5 mr-1.5" /> Expenses
            </TabsTrigger>
            <TabsTrigger value="dpr" data-testid="tab-dpr">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> DPR
            </TabsTrigger>
          </TabsList>

          {/* ─── Attendance ─── */}
          <TabsContent value="attendance" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                {attendanceReport && (
                  <>
                    <span className="text-green-600 font-medium">✓ Present: {attendanceReport.totals.present}</span>
                    <span className="text-red-600 font-medium">✗ Absent: {attendanceReport.totals.absent}</span>
                    <span className="text-yellow-600 font-medium">½ Half Day: {attendanceReport.totals.halfDay}</span>
                  </>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCSV("attendance")}
                disabled={!isReady}
                data-testid="button-export-attendance-csv"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {attLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !attendanceReport?.rows.length ? (
                  <div className="p-8 text-center text-muted-foreground">No attendance records in this range</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Worker</TableHead>
                          <TableHead>Contractor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>In</TableHead>
                          <TableHead>Out</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceReport.rows.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="tabular-nums text-sm">{r.date}</TableCell>
                            <TableCell className="font-medium">{r.workerName}</TableCell>
                            <TableCell className="text-muted-foreground">{r.contractorName || "—"}</TableCell>
                            <TableCell>
                              <Badge className={`${statusColors[r.status]} text-xs`}>{r.status}</Badge>
                            </TableCell>
                            <TableCell className="tabular-nums">{r.checkIn || "—"}</TableCell>
                            <TableCell className="tabular-nums">{r.checkOut || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Expenses ─── */}
          <TabsContent value="expenses" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {expenseReport && (
                  <span className="font-medium">
                    Total: ₹{expenseReport.totalAmount.toLocaleString("en-IN")} ({expenseReport.rows.length} records)
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCSV("expenses")}
                disabled={!isReady}
                data-testid="button-export-expenses-csv"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {expLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !expenseReport?.rows.length ? (
                  <div className="p-8 text-center text-muted-foreground">No expenses in this range</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseReport.rows.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="tabular-nums text-sm">{r.date}</TableCell>
                            <TableCell>{r.category}</TableCell>
                            <TableCell className="text-muted-foreground">{r.vendorName || "—"}</TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              ₹{Number(r.amount).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell className="text-sm capitalize">{r.paymentMode}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[180px] truncate">{r.notes || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── DPR ─── */}
          <TabsContent value="dpr" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {dprReport && <span className="font-medium">{dprReport.total} reports</span>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCSV("dpr")}
                disabled={!isReady}
                data-testid="button-export-dpr-csv"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {dprLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : !dprReport?.rows.length ? (
                  <div className="p-8 text-center text-muted-foreground">No DPR reports in this range</div>
                ) : (
                  <div className="space-y-3 p-4">
                    {dprReport.rows.map((r, i) => (
                      <Card key={i} className="border-l-4 border-l-primary/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium tabular-nums">{r.date}</span>
                            {r.manpowerCount && (
                              <Badge variant="secondary" className="text-xs">{r.manpowerCount} workers</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{r.workDone}</p>
                          {r.contractorName && (
                            <p className="text-xs text-muted-foreground mt-1">Contractor: {r.contractorName}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
