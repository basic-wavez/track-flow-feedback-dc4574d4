
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
    const compressedUrl = await uploadFileInChunks(file, uniquePath, 'audio', onProgress);
    
    // Create a record in the tracks table
    const trackTitle = title || file.name.split('.')[0]; // Use provided title or extract from filename
    
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        title: trackTitle,
        compressed_url: compressedUrl,
        original_filename: file.name,
        user_id: user.id,
        downloads_enabled: false
      })
      .select()
      .single();
      
    if (trackError) {
      throw trackError;
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
