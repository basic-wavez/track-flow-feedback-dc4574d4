
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";

export interface TrackData {
  id: string;
  title: string;
  compressed_url: string;
  original_url?: string;
  original_filename: string;
  user_id: string;
  created_at?: string;
}

export const uploadTrack = async (
  file: File, 
  title?: string
): Promise<TrackData | null> => {
  try {
    // Check if the file size exceeds 80MB (80 * 1024 * 1024 bytes = 83886080 bytes)
    const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds the 80MB limit (your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to upload tracks");
    }

    // Generate a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const uniquePath = `${user.id}/${uniqueFileName}`;
    
    // Upload the file to the audio bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(uniquePath, file);
      
    if (uploadError) {
      // Check for specific Supabase storage errors related to file size
      if (uploadError.message && uploadError.message.includes("exceeded the maximum allowed size")) {
        throw new Error(`File size exceeds the server limit of 80MB (your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
      }
      throw uploadError;
    }
    
    // Get the public URL for the file
    const { data: { publicUrl: compressedUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(uniquePath);
    
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
    toast({
      title: "Upload Failed",
      description: error.message || "There was an error uploading your track",
      variant: "destructive",
    });
    return null;
  }
};

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

export const updateTrackDetails = async (
  trackId: string,
  details: { title?: string; description?: string; downloads_enabled?: boolean }
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
