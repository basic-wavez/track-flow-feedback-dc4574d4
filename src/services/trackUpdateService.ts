
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { TrackUpdateDetails } from "@/types/track";

/**
 * Updates track details
 */
export const updateTrackDetails = async (
  trackId: string,
  details: TrackUpdateDetails
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tracks')
      .update(details)
      .eq('id', trackId);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    toast({
      title: "Update Failed",
      description: error.message || "Could not update track details",
      variant: "destructive",
    });
    return false;
  }
};
