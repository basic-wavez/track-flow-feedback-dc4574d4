
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistance } from "date-fns";
import { Shield, Search, User, X, AlertTriangle, RefreshCcw } from "lucide-react";
import AdminUserDetails from "./AdminUserDetails";
import { getUserEmails, UserEmailResult } from "@/lib/adminHelpers";

interface UserData {
  id: string;
  email: string | null;
  created_at: string;
  username: string | null;
  is_admin: boolean;
}

// Helper function to safely format dates
const safeFormatDistance = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "Unknown";
  
  try {
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid date";
  }
};

const AdminUsersList = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Use useCallback to prevent excessive re-renders
  const fetchUsers = useCallback(async () => {
    console.log("AdminUsersList - Starting to fetch users");
    setLoading(true);
    setError(null);
    
    try {
      // Query profiles, explicitly selecting created_at
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, created_at');
        
      if (profileError) {
        console.error("AdminUsersList - Profile error:", profileError);
        setError("Failed to load user profiles");
        return;
      }
      
      if (!profiles || profiles.length === 0) {
        console.log("AdminUsersList - No profiles found");
        setUsers([]);
        return;
      }
      
      console.log("AdminUsersList - Profiles fetched:", profiles.length);
      
      // Get users with emails using our custom helper
      let emails: UserEmailResult[] = [];
      try {
        emails = await getUserEmails();
        console.log("AdminUsersList - Emails fetched:", emails.length);
      } catch (emailError) {
        console.error("AdminUsersList - Email fetch error:", emailError);
        toast({
          title: "Warning",
          description: "Could not fetch user emails. Some user information may be incomplete.",
          variant: "destructive"
        });
      }
      
      // Create an email lookup map
      const emailMap: Record<string, string> = {};
      emails.forEach((item: UserEmailResult) => {
        emailMap[item.user_id] = item.email;
      });
      
      // Fetch admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (rolesError) {
        console.error("AdminUsersList - Roles error:", rolesError);
        // Continue with empty admin roles
      }
      
      console.log("AdminUsersList - Admin roles fetched:", adminRoles?.length || 0);
      
      // Create a set of admin user IDs
      const adminSet = new Set(adminRoles?.map(role => role.user_id) || []);
      
      // Process and validate profile data
      const userData: UserData[] = profiles.map(profile => {
        // Ensure created_at is a valid date, or use current date as fallback
        let createdAt: string;
        try {
          if (profile.created_at) {
            // Validate the date
            new Date(profile.created_at).toISOString();
            createdAt = profile.created_at;
          } else {
            createdAt = new Date().toISOString();
          }
        } catch (e) {
          console.error(`Invalid date for user ${profile.id}:`, profile.created_at);
          createdAt = new Date().toISOString();
        }
        
        return {
          id: profile.id,
          email: emailMap[profile.id] || null,
          created_at: createdAt,
          username: profile.username,
          is_admin: adminSet.has(profile.id)
        };
      });
      
      console.log("AdminUsersList - Combined user data:", userData.length);
      setUsers(userData);
      setError(null);
    } catch (error: any) {
      console.error("AdminUsersList - Error fetching users:", error);
      setError(error.message || "Failed to fetch users");
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const toggleAdminRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
        
        toast({
          title: "Admin role removed",
          description: "User is no longer an administrator",
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        
        if (error) throw error;
        
        toast({
          title: "Admin role added",
          description: "User is now an administrator",
        });
      }
      
      // Update the UI
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, is_admin: !isCurrentlyAdmin };
        }
        return user;
      }));
      
    } catch (error: any) {
      toast({
        title: "Error updating admin role",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error updating admin role:", error);
    }
  };
  
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.email?.toLowerCase() || "").includes(searchLower) || 
      (user.username?.toLowerCase() || "").includes(searchLower)
    );
  });
  
  const openUserDetails = (userId: string) => {
    setSelectedUserId(userId);
    setDialogOpen(true);
  };

  const handleRetry = () => {
    fetchUsers();
  };
  
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl font-semibold">User Management</h2>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/50 rounded-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
          <p className="mb-4">{error}</p>
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCcw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl font-semibold">User Management</h2>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{user.username || "No username"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || "No email"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {safeFormatDistance(user.created_at)}
                    </TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Shield className="h-4 w-4 text-wip-pink" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={dialogOpen && selectedUserId === user.id} onOpenChange={(open) => {
                          if (!open) setSelectedUserId(null);
                          setDialogOpen(open);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openUserDetails(user.id)}
                            >
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                              <DialogDescription>
                                View detailed information about this user
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUserId === user.id && (
                              <AdminUserDetails userId={user.id} />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant={user.is_admin ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => toggleAdminRole(user.id, user.is_admin)}
                        >
                          {user.is_admin ? "Remove Admin" : "Make Admin"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersList;
