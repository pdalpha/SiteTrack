import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSites } from "@/hooks/use-sites";
import type { User, InsertUser, Site } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserPlus, Shield, Eye, Wrench } from "lucide-react";
import { useState } from "react";

const roleBadge: Record<string, { className: string; icon: typeof Shield }> = {
  admin: { className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400", icon: Shield },
  supervisor: { className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Wrench },
  staff: { className: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400", icon: Eye },
};

export default function UsersPage() {
  const { toast } = useToast();
  const { data: sites = [] } = useSites();
  const [open, setOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "temp123",
    role: "staff" as "admin" | "supervisor" | "staff",
    siteId: null as number | null,
    active: true,
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertUser>) => {
      const res = await apiRequest("api/users", { method: "POST", body: JSON.stringify(data) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setOpen(false);
      setForm({ name: "", email: "", mobile: "", password: "temp123", role: "staff", siteId: null, active: true });
      toast({ title: "User created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await apiRequest(`api/users/${id}`, { method: "PUT", body: JSON.stringify({ active }) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User updated" });
    },
  });

  const filtered = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  const getSiteName = (siteId: number | null) => {
    if (!siteId) return "—";
    return sites.find((s) => s.id === siteId)?.name ?? "—";
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} team members</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <UserPlus className="w-4 h-4 mr-1" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rajesh Patil"
                  data-testid="input-user-name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. rajesh@company.com"
                  data-testid="input-user-email"
                />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  data-testid="input-user-mobile"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as any })}>
                  <SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role !== "admin" && (
                <div>
                  <Label>Assign Site</Label>
                  <Select
                    value={form.siteId?.toString() ?? "none"}
                    onValueChange={(v) => setForm({ ...form, siteId: v === "none" ? null : Number(v) })}
                  >
                    <SelectTrigger data-testid="select-assign-site"><SelectValue placeholder="No site" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No site assigned</SelectItem>
                      {sites.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Temporary Password</Label>
                <Input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  data-testid="input-user-password"
                />
                <p className="text-xs text-muted-foreground mt-1">User should change this after first login</p>
              </div>
              <Button
                className="w-full"
                disabled={!form.name || !form.email || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    name: form.name,
                    email: form.email,
                    mobile: form.mobile || null,
                    password: form.password,
                    role: form.role,
                    siteId: form.siteId,
                    active: true,
                  })
                }
                data-testid="button-submit-user"
              >
                {createMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "admin", "supervisor", "staff"].map((r) => (
          <Button
            key={r}
            size="sm"
            variant={roleFilter === r ? "default" : "secondary"}
            onClick={() => setRoleFilter(r)}
            data-testid={`filter-role-${r}`}
          >
            {r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => {
                    const badge = roleBadge[u.role];
                    return (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`} className={!u.active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell className="text-sm tabular-nums">{u.mobile || "—"}</TableCell>
                        <TableCell>
                          <Badge className={`${badge?.className} text-xs`}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{getSiteName(u.siteId)}</TableCell>
                        <TableCell>
                          <Switch
                            checked={u.active}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: u.id, active: checked })}
                            data-testid={`switch-active-${u.id}`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
