import { useState } from "react";
import { useAuth, useChangePassword } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Wrench, Eye, User, Lock } from "lucide-react";

const roleBadge: Record<string, { className: string; icon: typeof Shield }> = {
  admin: { className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400", icon: Shield },
  supervisor: { className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Wrench },
  staff: { className: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400", icon: Eye },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Profile edit form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; mobile: string }) => {
      const res = await apiRequest(`api/users/${user?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Change password form
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const changePasswordMutation = useChangePassword();

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!pwForm.currentPassword) errors.currentPassword = "Current password is required";
    if (!pwForm.newPassword) errors.newPassword = "New password is required";
    else if (pwForm.newPassword.length < 6) errors.newPassword = "Must be at least 6 characters";
    if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = "Passwords do not match";
    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;

    changePasswordMutation.mutate(
      { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
      {
        onSuccess: () => {
          toast({ title: "Password changed successfully" });
          setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        },
        onError: (e: Error) => {
          const msg = e.message.includes("401") ? "Current password is incorrect" : e.message;
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  if (!user) return null;

  const badge = roleBadge[user.role];
  const RoleIcon = badge.icon;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold" data-testid="text-page-title">Profile & Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account information</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
            <Badge className={`${badge.className} text-xs ml-auto`}>
              <RoleIcon className="w-3 h-3 mr-1" />
              {user.role}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input
              id="profile-name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              placeholder="Your full name"
              data-testid="input-profile-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-mobile">Mobile</Label>
            <Input
              id="profile-mobile"
              value={profileForm.mobile}
              onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
              placeholder="10-digit mobile number"
              data-testid="input-profile-mobile"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <Button
            onClick={() => updateProfileMutation.mutate(profileForm)}
            disabled={!profileForm.name || updateProfileMutation.isPending}
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Change password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                data-testid="input-current-password"
                autoComplete="current-password"
              />
              {pwErrors.currentPassword && (
                <p className="text-xs text-destructive">{pwErrors.currentPassword}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                data-testid="input-new-password"
                autoComplete="new-password"
              />
              {pwErrors.newPassword && (
                <p className="text-xs text-destructive">{pwErrors.newPassword}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                data-testid="input-confirm-password"
                autoComplete="new-password"
              />
              {pwErrors.confirmPassword && (
                <p className="text-xs text-destructive">{pwErrors.confirmPassword}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
