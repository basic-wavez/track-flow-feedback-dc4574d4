
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import { TrackData } from "@/types/track";
import { uploadFileInChunks, validateFileSize } from "./uploadService";
import { requestMp3Processing } from "./trackProcessingService";

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
