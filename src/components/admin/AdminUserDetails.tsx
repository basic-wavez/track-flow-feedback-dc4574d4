
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDistance } from "date-fns";
import { getUserDetails } from "@/lib/adminHelpers";

interface UserDetailsProps {
  userId: string;
}

interface UserStats {
  trackCount: number;
  feedbackGiven: number;
  lastActive: string | null;
}

const AdminUserDetails = ({ userId }: UserDetailsProps) => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    trackCount: 0,
    feedbackGiven: 0,
    lastActive: null
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      
      try {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) throw profileError;
        
        // Get user's email and metadata using our custom helper
        const userData = await getUserDetails(userId);
          
        if (!userData) {
          console.error("Could not fetch user details");
          // Continue without user details if they can't be fetched
        }
        
        // Fetch track count
        const { count: trackCount, error: trackError } = await supabase
          .from('tracks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        if (trackError) throw trackError;
        
        // Fetch feedback count
        const { count: feedbackCount, error: feedbackError } = await supabase
          .from('feedback')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        if (feedbackError) throw feedbackError;
        
        // Find last active timestamp (most recent track or feedback)
        const { data: lastTrack } = await supabase
          .from('tracks')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        const { data: lastFeedback } = await supabase
          .from('feedback')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        // Combine data
        const userInfo = {
          id: userId,
          email: userData ? userData.email : null,
          created_at: userData ? userData.created_at : new Date().toISOString(),
          last_sign_in_at: userData ? userData.last_sign_in_at : null,
          email_confirmed_at: userData ? userData.email_confirmed_at : null,
          profile
        };
        
        setUserDetails(userInfo);
        
        const lastTrackDate = lastTrack && lastTrack[0] ? new Date(lastTrack[0].created_at) : null;
        const lastFeedbackDate = lastFeedback && lastFeedback[0] ? new Date(lastFeedback[0].created_at) : null;
        
        let lastActive = null;
        if (lastTrackDate && lastFeedbackDate) {
          lastActive = lastTrackDate > lastFeedbackDate ? lastTrackDate : lastFeedbackDate;
        } else if (lastTrackDate) {
          lastActive = lastTrackDate;
        } else if (lastFeedbackDate) {
          lastActive = lastFeedbackDate;
        }
        
        setUserStats({
          trackCount: trackCount || 0,
          feedbackGiven: feedbackCount || 0,
          lastActive: lastActive ? lastActive.toISOString() : null
        });
        
      } catch (error: any) {
        toast({
          title: "Error fetching user details",
          description: error.message,
          variant: "destructive"
        });
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserDetails();
    }
  }, [userId, toast]);
  
  const resetUserPassword = async () => {
    if (!userDetails?.email) {
      toast({
        title: "Cannot reset password",
        description: "User email is not available",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        userDetails.email,
        { redirectTo: `${window.location.origin}/auth` }
      );
      
      if (error) throw error;
      
      toast({
        title: "Password reset email sent",
        description: "User will receive instructions to reset their password"
      });
    } catch (error: any) {
      toast({
        title: "Error sending password reset",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-4 border-wip-pink border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!userDetails) {
    return <div>User not found</div>;
  }
  
  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
          <p>{userDetails.email || "Not available"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
          <p>{userDetails.profile?.username || "No username set"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
          <p className="text-xs truncate">{userDetails.id}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
          <p>{userDetails.created_at ? new Date(userDetails.created_at).toLocaleString() : "Unknown"}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Last Sign In</h3>
          <p>
            {userDetails.last_sign_in_at
              ? formatDistance(new Date(userDetails.last_sign_in_at), new Date(), { addSuffix: true })
              : "Never"}
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Email Confirmed</h3>
          <p>{userDetails.email_confirmed_at ? "Yes" : "No"}</p>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-medium mb-2">Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-wip-gray/10 p-4 rounded-md">
            <h4 className="text-sm font-medium text-muted-foreground">Tracks</h4>
            <p className="text-xl font-bold">{userStats.trackCount}</p>
          </div>
          
          <div className="bg-wip-gray/10 p-4 rounded-md">
            <h4 className="text-sm font-medium text-muted-foreground">Feedback Given</h4>
            <p className="text-xl font-bold">{userStats.feedbackGiven}</p>
          </div>
          
          <div className="bg-wip-gray/10 p-4 rounded-md">
            <h4 className="text-sm font-medium text-muted-foreground">Last Active</h4>
            <p>
              {userStats.lastActive
                ? formatDistance(new Date(userStats.lastActive), new Date(), { addSuffix: true })
                : "Never"}
            </p>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-medium mb-2">Actions</h3>
        <div className="flex gap-2">
          <Button onClick={resetUserPassword} variant="outline">
            Send Password Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;
