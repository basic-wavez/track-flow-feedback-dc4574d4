
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Request MP3 processing for a track
 * @param trackId The ID of the track to process
 * @returns A promise that resolves when the request is complete
 */
export async function requestMp3Processing(trackId: string): Promise<boolean> {
  try {
    // Call the edge function to trigger MP3 processing
    const response = await fetch(`https://qzykfyavenplpxpdnfxh.supabase.co/functions/v1/process-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        trackId,
        format: 'mp3'
      })
    });

    const data = await response.json();
    
    console.log("MP3 processing response:", data);
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to start processing");
    }
    
    toast.success("MP3 processing started");
    return true;
  } catch (error) {
    console.error("Error requesting MP3 processing:", error);
    toast.error("Failed to start MP3 processing");
    return false;
  }
}

/**
 * Request Opus processing for a track
 * @param trackId The ID of the track to process
 * @returns A promise that resolves when the request is complete
 */
export async function requestOpusProcessing(trackId: string): Promise<boolean> {
  try {
    // Call the edge function to trigger Opus processing
    const response = await fetch(`https://qzykfyavenplpxpdnfxh.supabase.co/functions/v1/process-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        trackId,
        format: 'opus'
      })
    });

    const data = await response.json();
    
    console.log("Opus processing response:", data);
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to start processing");
    }
    
    toast.success("Opus processing started");
    return true;
  } catch (error) {
    console.error("Error requesting Opus processing:", error);
    toast.error("Failed to start Opus processing");
    return false;
  }
}

/**
 * Request processing for all formats (MP3 and Opus) for a track
 * @param trackId The ID of the track to process
 * @returns A promise that resolves when the request is complete
 */
export async function requestTrackProcessing(trackId: string): Promise<boolean> {
  try {
    // Call the edge function to trigger processing for all formats
    const response = await fetch(`https://qzykfyavenplpxpdnfxh.supabase.co/functions/v1/process-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        trackId,
        format: 'all'
      })
    });

    const data = await response.json();
    
    console.log("Track processing response:", data);
    
    if (!response.ok) {
      throw new Error(data.error || "Failed to start processing");
    }
    
    toast.success("Audio processing started");
    return true;
  } catch (error) {
    console.error("Error requesting track processing:", error);
    toast.error("Failed to start audio processing");
    return false;
  }
}

/**
 * Get the processing status for a track
 * @param trackId The ID of the track to check
 * @returns A promise that resolves to the processing status
 */
export async function getTrackProcessingStatus(trackId: string) {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('processing_status, opus_processing_status')
      .eq('id', trackId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      mp3Status: data?.processing_status || 'unknown',
      opusStatus: data?.opus_processing_status || 'unknown'
    };
  } catch (error) {
    console.error("Error checking processing status:", error);
    return { mp3Status: 'unknown', opusStatus: 'unknown' };
  }
}
