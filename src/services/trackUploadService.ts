
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import { TrackData } from "@/types/track";
import { uploadFileInChunks, validateFileSize } from "./uploadService";
import { requestMp3Processing } from "./trackProcessingService";
import { handleError } from "@/utils/errorHandler";

/**
 * Uploads a track to storage and creates a database record
 */
export const uploadTrack = async (
  file: File, 
  title?: string,
  onProgress?: (progress: number) => void
): Promise<TrackData | null> => {
  try {
    console.log("trackUploadService - Starting upload of:", file.name, file.type, file.size);
    console.log("trackUploadService - File object type:", Object.prototype.toString.call(file));
    console.log("trackUploadService - File object properties:", Object.keys(file));
    
    // Validate file size
    validateFileSize(file);

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("trackUploadService - Auth error:", userError);
      throw new Error("Authentication error: " + userError.message);
    }
    
    if (!user) {
      console.error("trackUploadService - No authenticated user found");
      throw new Error("You must be logged in to upload tracks");
    }

    console.log("trackUploadService - Authenticated user:", user.id);

    // Generate a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const uniquePath = `${user.id}/${uniqueFileName}`;
    
    console.log("trackUploadService - Generated unique path:", uniquePath);
    
    // Upload the file to storage using chunking for the compressed version
    console.log("trackUploadService - Starting chunked upload");
    const { compressedUrl, totalChunks } = await uploadFileInChunks(file, uniquePath, 'audio', onProgress);
    console.log("trackUploadService - Chunked upload complete, URL:", compressedUrl, "Total chunks:", totalChunks);
    
    // Upload the original file directly to storage for download purposes
    const originalFilePath = `${user.id}/original_${uniqueFileName}`;
    console.log("trackUploadService - Uploading original file to:", originalFilePath);
    
    const { data: originalFileData, error: originalFileError } = await supabase.storage
      .from('audio')
      .upload(originalFilePath, file);
      
    if (originalFileError) {
      console.error("trackUploadService - Error uploading original file:", originalFileError);
      // Continue with process even if original file upload fails
    } else {
      console.log("trackUploadService - Original file upload complete");
    }
    
    // Get public URL for the original file
    const { data: originalUrlData } = originalFileError ? { data: null } : 
      await supabase.storage
        .from('audio')
        .getPublicUrl(originalFilePath);
    
    // Create a record in the tracks table
    const trackTitle = title || file.name.split('.')[0]; // Use provided title or extract from filename
    
    console.log("trackUploadService - Creating track record with title:", trackTitle);
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        title: trackTitle,
        compressed_url: compressedUrl,
        original_filename: file.name,
        original_url: originalUrlData?.publicUrl || null,
        user_id: user.id,
        downloads_enabled: false,
        chunk_count: totalChunks, // Store the number of chunks
        processing_status: 'pending' // Initial processing status
      })
      .select()
      .single();
      
    if (trackError) {
      console.error("trackUploadService - Error creating track record:", trackError);
      throw trackError;
    }

    console.log("trackUploadService - Track record created successfully:", track.id);

    // Automatically request MP3 processing for the new track
    if (track) {
      requestMp3Processing(track.id)
        .then(() => console.log("trackUploadService - MP3 processing requested for track", track.id))
        .catch(error => console.error("trackUploadService - Failed to request MP3 processing:", error));
    }
    
    return track;
  } catch (error: any) {
    console.error("trackUploadService - Upload error:", error);
    handleError(error, "Upload Failed", "There was an error uploading your track");
    return null;
  }
};
