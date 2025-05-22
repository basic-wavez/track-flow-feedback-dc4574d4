
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Saves waveform data to the database for a track
 * This helps persist browser-analyzed waveform data
 */
export const saveTrackWaveformData = async (
  trackId: string,
  waveformData: Float32Array | number[]
): Promise<boolean> => {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("Cannot save waveform data: User not authenticated");
      return false;
    }
    
    // Convert Float32Array to regular array for storage
    const dataArray = Array.from(waveformData);
    
    // Update the track record with the waveform data
    const { error } = await supabase
      .from('tracks')
      .update({ 
        waveform_data: dataArray,
        updated_at: new Date().toISOString()
      })
      .eq('id', trackId)
      .eq('user_id', user.id); // Ensure user can only update their own tracks
      
    if (error) {
      console.error("Error saving waveform data:", error);
      return false;
    }
    
    console.log("Successfully saved waveform data for track:", trackId);
    return true;
  } catch (error: any) {
    console.error("Error saving track waveform data:", error);
    return false;
  }
};

/**
 * Retrieves waveform data from the database for a track
 */
export const getTrackWaveformData = async (trackId: string): Promise<Float32Array | null> => {
  try {
    // Query the track's waveform data
    const { data: track, error } = await supabase
      .from('tracks')
      .select('waveform_data')
      .eq('id', trackId)
      .single();
      
    if (error || !track) {
      console.error("Error fetching waveform data:", error);
      return null;
    }
    
    // Check if waveform data exists
    if (!track.waveform_data || !Array.isArray(track.waveform_data)) {
      return null;
    }
    
    // Convert to Float32Array for rendering
    return Float32Array.from(track.waveform_data);
  } catch (error: any) {
    console.error("Error getting track waveform data:", error);
    return null;
  }
};
