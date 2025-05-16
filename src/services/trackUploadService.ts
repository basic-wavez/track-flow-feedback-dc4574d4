
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import { TrackData } from "@/types/track";
import { uploadFile, validateFileSize } from "./uploadService";
import { requestMp3Processing } from "./trackProcessingService";
import { handleError } from "@/utils/errorHandler";
import { extractTrackName } from "@/lib/audioUtils"; // Import the extractTrackName function

/**
 * Uploads a track to storage and creates a database record
 */
export const uploadTrack = async (
  file: File, 
  title?: string,
  onProgress?: (progress: number) => void,
  parentTrackId?: string,
  versionNotes?: string
): Promise<TrackData | null> => {
  try {
    console.log("trackUploadService - Starting upload of:", file.name, file.type, file.size);
    
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
    const filePath = `${user.id}/${uniqueFileName}`;
    
    console.log("trackUploadService - Generated unique path:", filePath);
    
    // Upload file to storage with progress tracking
    console.log("trackUploadService - Starting file upload");
    const publicUrl = await uploadFile(file, filePath, 'audio', onProgress);
    console.log("trackUploadService - Upload complete, URL:", publicUrl);
    
    // If this is a new version of an existing track, update the old version to not be latest
    let versionNumber = 1;
    
    if (parentTrackId) {
      console.log("trackUploadService - This is a new version of track:", parentTrackId);
      
      // Get the parent track to determine its version
      const { data: parentTrack, error: parentTrackError } = await supabase
        .from('tracks')
        .select('version_number')
        .eq('id', parentTrackId)
        .single();
        
      if (parentTrackError) {
        console.error("trackUploadService - Error fetching parent track:", parentTrackError);
      } else if (parentTrack) {
        // Increment the version number
        versionNumber = (parentTrack.version_number || 1) + 1;
        console.log("trackUploadService - New version number:", versionNumber);
        
        // Mark previous version as not latest
        await supabase
          .from('tracks')
          .update({ is_latest_version: false })
          .eq('id', parentTrackId);
      }
    }
    
    // Create a record in the tracks table
    // If title is provided, use it; otherwise use the extracted filename without extension
    // This now uses the extractTrackName function to preserve exact formatting
    const trackTitle = title || extractTrackName(file.name);
    
    console.log("trackUploadService - Creating track record with title:", trackTitle);
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        title: trackTitle,
        compressed_url: publicUrl,  // This will be the same as the original URL initially
        original_filename: file.name,
        original_url: publicUrl,    // Both URLs are the same since we're uploading once
        user_id: user.id,
        downloads_enabled: false,
        processing_status: 'pending', // Initial processing status
        parent_track_id: parentTrackId || null,
        version_number: versionNumber,
        is_latest_version: true,
        version_notes: versionNotes || null
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

/**
 * Creates a new version of an existing track
 */
export const createTrackVersion = async (
  originalTrackId: string,
  file: File,
  versionNotes?: string,
  onProgress?: (progress: number) => void
): Promise<TrackData | null> => {
  try {
    // First get the original track details to maintain title consistency
    const { data: originalTrack, error: fetchError } = await supabase
      .from('tracks')
      .select('title')
      .eq('id', originalTrackId)
      .single();
      
    if (fetchError) {
      console.error("trackUploadService - Error fetching original track:", fetchError);
      throw new Error("Could not find the original track");
    }
    
    // Upload the new version with the same title but as a child of the original
    return await uploadTrack(
      file,
      originalTrack.title,
      onProgress,
      originalTrackId,
      versionNotes
    );
  } catch (error: any) {
    console.error("trackUploadService - Version creation error:", error);
    handleError(error, "Version Creation Failed", "There was an error creating a new version of your track");
    return null;
  }
};
