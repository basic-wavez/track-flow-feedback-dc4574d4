
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { TrackUpdateDetails } from "@/types/track";

/**
 * Updates track details like title, description, or download settings
 */
export const updateTrackDetails = async (trackId: string, details: TrackUpdateDetails): Promise<boolean> => {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to update track details");
    }
    
    // Update the track record
    const { error } = await supabase
      .from('tracks')
      .update(details)
      .eq('id', trackId)
      .eq('user_id', user.id); // Ensure user can only update their own tracks
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error("Error updating track:", error);
    toast({
      title: "Update Failed",
      description: error.message || "There was an error updating your track",
      variant: "destructive",
    });
    return false;
  }
};
