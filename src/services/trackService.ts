
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import { TrackData, TrackUpdateDetails } from "@/types/track";
import { uploadFileInChunks, validateFileSize } from "./uploadService";

/**
 * Uploads a track to storage and creates a database record
 */
export const uploadTrack = async (
  file: File, 
  title?: string,
  onProgress?: (progress: number) => void
): Promise<TrackData | null> => {
  try {
    // Validate file size
    validateFileSize(file);

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to upload tracks");
    }

    // Generate a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const uniquePath = `${user.id}/${uniqueFileName}`;
    
    // Upload the file to storage using chunking
    const { compressedUrl, totalChunks } = await uploadFileInChunks(file, uniquePath, 'audio', onProgress);
    
    // Create a record in the tracks table
    const trackTitle = title || file.name.split('.')[0]; // Use provided title or extract from filename
    
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        title: trackTitle,
        compressed_url: compressedUrl,
        original_filename: file.name,
        user_id: user.id,
        downloads_enabled: false,
        chunk_count: totalChunks, // Store the number of chunks
        processing_status: 'pending' // Initial processing status
      })
      .select()
      .single();
      
    if (trackError) {
      throw trackError;
    }

    // Automatically request MP3 processing for the new track
    if (track) {
      requestMp3Processing(track.id)
        .then(() => console.log("MP3 processing requested"))
        .catch(error => console.error("Failed to request MP3 processing:", error));
    }
    
    return track;
  } catch (error: any) {
    console.error("Upload error:", error);
    toast({
      title: "Upload Failed",
      description: error.message || "There was an error uploading your track",
      variant: "destructive",
    });
    return null;
  }
};

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
      throw new Error(errorData.error || 'Failed to request processing');
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
 * Fetches a track by ID
 */
export const getTrack = async (trackId: string): Promise<TrackData | null> => {
  try {
    const { data: track, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();
      
    if (error) {
      throw error;
    }
    
    return track;
  } catch (error: any) {
    toast({
      title: "Error Loading Track",
      description: error.message || "Failed to load track details",
      variant: "destructive",
    });
    return null;
  }
};

/**
 * Fetches all chunks for a track and returns their URLs
 * Includes improved error handling and validation
 */
export const getTrackChunkUrls = async (trackId: string): Promise<string[]> => {
  try {
    // First, get the track details
    const track = await getTrack(trackId);
    if (!track) {
      throw new Error("Track not found");
    }
    
    // If track has a processed MP3, return it as the only "chunk"
    if (track.mp3_url && track.processing_status === 'completed') {
      console.log("Using processed MP3:", track.mp3_url);
      return [track.mp3_url];
    }
    
    // If track doesn't have chunks or just one chunk, return main URL
    if (!track.chunk_count || track.chunk_count <= 1) {
      return [track.compressed_url];
    }
    
    // Extract base path from the compressed_url
    const baseUrl = track.compressed_url;
    const chunkUrls: string[] = []; 
    
    // The baseUrl should be chunk_0
    if (!baseUrl.includes('_chunk_')) {
      // If the URL doesn't contain '_chunk_', it might be a legacy track
      console.log("This appears to be a non-chunked track:", baseUrl);
      return [baseUrl];
    }
    
    // Extract the base path (everything before _chunk_X)
    const basePath = baseUrl.split('_chunk_0')[0];
    
    // Check if the first chunk URL is valid
    const firstChunkUrl = `${basePath}_chunk_0`;
    let isFirstChunkValid = false;
    
    try {
      // Try to validate the first chunk URL format
      const { data: firstChunkData } = await supabase.storage
        .from('audio')
        .getPublicUrl(firstChunkUrl.split('/public/audio/')[1]);
        
      chunkUrls.push(firstChunkData.publicUrl);
      isFirstChunkValid = true;
    } catch (error) {
      console.error("Error validating first chunk:", error);
      // Fall back to the original URL if validation fails
      chunkUrls.push(baseUrl);
    }
    
    // If first chunk validation failed, don't try to get other chunks
    if (!isFirstChunkValid) {
      console.warn("First chunk validation failed, using original URL only");
      return [baseUrl];
    }
    
    // For each additional chunk, construct its URL and validate it
    for (let i = 1; i < track.chunk_count; i++) {
      try {
        const chunkPath = `${basePath}_chunk_${i}`.split('/public/audio/')[1];
        
        // Verify chunk exists in storage and get its public URL
        const { data } = await supabase.storage
          .from('audio')
          .getPublicUrl(chunkPath);
          
        chunkUrls.push(data.publicUrl);
        console.log(`Added chunk ${i}:`, data.publicUrl);
      } catch (error) {
        console.error(`Error getting URL for chunk ${i}:`, error);
        // Don't break the whole process if one chunk fails
        // Instead, log the error and continue
      }
    }
    
    console.log(`Retrieved ${chunkUrls.length}/${track.chunk_count} chunk URLs`);
    
    // If we didn't get any valid chunk URLs, fall back to the original URL
    if (chunkUrls.length === 0) {
      return [baseUrl];
    }
    
    return chunkUrls;
  } catch (error: any) {
    console.error("Error fetching chunk URLs:", error);
    return [];
  }
};

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

/**
 * Fetches all tracks for the current user
 */
export const getUserTracks = async (): Promise<TrackData[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    toast({
      title: "Error Loading Tracks",
      description: error.message || "Failed to load your tracks",
      variant: "destructive",
    });
    return [];
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
