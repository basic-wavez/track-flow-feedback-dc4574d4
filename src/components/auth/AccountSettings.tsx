
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const AccountSettings = () => {
  const { user, updateUsername, updatePassword } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setUsernameError("Username cannot be empty");
      return;
    }
    
    setIsUpdatingUsername(true);
    setUsernameError("");
    try {
      await updateUsername(username);
      setUsername("");
      toast({
        title: "Username updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating username:", error);
      // Check for duplicate username error
      if (error.message?.includes("duplicate key")) {
        setUsernameError("Username is already taken. Please choose a different one.");
      } else {
        setUsernameError(error.message || "Failed to update username");
      }
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  // Clear error on input change
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (usernameError) {
      setUsernameError("");
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await updatePassword(newPassword, currentPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      setPasswordError(error.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-wip-darker border-wip-gray">
        <CardHeader>
          <CardTitle>Update Username</CardTitle>
          <CardDescription>Change how your name appears on the platform</CardDescription>
        </CardHeader>
        <form onSubmit={handleUsernameUpdate}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter new username"
                  value={username}
                  onChange={handleUsernameChange}
                  disabled={isUpdatingUsername}
                  className={usernameError ? "border-red-500" : ""}
                />
                {usernameError && (
                  <p className="text-sm text-red-500 mt-1">{usernameError}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={!username.trim() || isUpdatingUsername}
            >
              {isUpdatingUsername && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Username
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="bg-wip-darker border-wip-gray">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordUpdate}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdatingPassword}
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={!currentPassword || !newPassword || !confirmPassword || isUpdatingPassword}
            >
              {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AccountSettings;
