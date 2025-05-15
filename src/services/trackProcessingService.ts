
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { getTrack } from "./trackQueryService";

/**
 * Requests MP3 processing for a track
 */
export const requestMp3Processing = async (trackId: string): Promise<boolean> => {
  try {
    // Get the current session using the proper method
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';

    const response = await fetch(`https://qzykfyavenplpxpdnfxh.supabase.co/functions/v1/process-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ trackId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("MP3 processing request failed:", response.status, errorData);
      throw new Error(errorData.error || `Processing request failed with status ${response.status}`);
    }

    return true;
  } catch (error: any) {
    console.error("Processing request error:", error);
    toast({
      title: "Processing Request Failed",
      description: error.message || "There was an error requesting MP3 processing",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Manually request MP3 processing for an existing track
 */
export const requestTrackProcessing = async (trackId: string): Promise<boolean> => {
  try {
    // Check if track exists and is eligible for processing
    const track = await getTrack(trackId);
    
    if (!track) {
      throw new Error("Track not found");
    }
    
    // Don't reprocess if already completed
    if (track.processing_status === 'completed' && track.mp3_url) {
      toast({
        title: "Already Processed",
        description: "This track has already been processed successfully.",
      });
      return true;
    }
    
    // Reset status if it was previously failed
    if (track.processing_status === 'failed') {
      await supabase
        .from('tracks')
        .update({ processing_status: 'pending' })
        .eq('id', trackId);
    }
    
    // Request processing
    const success = await requestMp3Processing(trackId);
    
    if (success) {
      toast({
        title: "Processing Requested",
        description: "Your track will be processed into an MP3 for improved streaming."
      });
    }
    
    return success;
  } catch (error: any) {
    toast({
      title: "Processing Request Failed",
      description: error.message || "Failed to request MP3 processing",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Get the processing status of a track
 */
export const getTrackProcessingStatus = async (trackId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('processing_status')
      .eq('id', trackId)
      .single();
      
    if (error) {
      throw error;
    }
    
    return data?.processing_status || 'pending';
  } catch (error: any) {
    console.error("Error fetching processing status:", error);
    return 'unknown';
  }
};
