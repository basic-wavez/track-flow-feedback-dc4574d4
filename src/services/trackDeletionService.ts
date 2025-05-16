
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Delete a track and its associated feedback from the database
 * @param trackId The ID of the track to delete
 * @returns A promise that resolves to a boolean indicating success/failure
 */
export const deleteTrack = async (trackId: string): Promise<boolean> => {
  try {
    // First delete all feedback associated with this track
    // (This step is only needed if cascading delete is not set up in the database)
    const { error: feedbackError } = await supabase
      .from('feedback')
      .delete()
      .eq('track_id', trackId);
      
    if (feedbackError) {
      console.error('Error deleting associated feedback:', feedbackError);
      return false;
    }
      
    // Then delete the track itself
    const { error: trackError } = await supabase
      .from('tracks')
      .delete()
      .eq('id', trackId);
      
    if (trackError) {
      console.error('Error deleting track:', trackError);
      return false;
    }
    
    // If we reach here, deletion was successful
    return true;
  } catch (error) {
    console.error('Unexpected error during track deletion:', error);
    return false;
  }
};
