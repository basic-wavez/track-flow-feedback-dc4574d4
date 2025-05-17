
import { supabase } from "@/integrations/supabase/client";
import { TrackData } from "@/types/track";
import { handleError } from "@/utils/errorHandler";
import { uploadTrack } from "./trackUploadService";

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
    console.log("trackVersionService - Creating new version of track:", originalTrackId);
    
    // First get the original track details to maintain title consistency
    const { data: originalTrack, error: fetchError } = await supabase
      .from('tracks')
      .select('title, parent_track_id')
      .eq('id', originalTrackId)
      .single();
      
    if (fetchError) {
      console.error("trackVersionService - Error fetching original track:", fetchError);
      throw new Error("Could not find the original track");
    }
    
    // Determine the root parent track ID (earliest ancestor)
    let rootParentId = originalTrack.parent_track_id || originalTrackId;
    
    // If this track has a parent, we need to find the root parent
    if (originalTrack.parent_track_id) {
      let currentParentId = originalTrack.parent_track_id;
      let foundRootParent = false;
      
      // Traverse up the parent chain to find the root parent
      while (!foundRootParent) {
        const { data: parentTrack, error: parentError } = await supabase
          .from('tracks')
          .select('parent_track_id')
          .eq('id', currentParentId)
          .single();
          
        if (parentError || !parentTrack) {
          // If we can't get the parent, use the current ID as root
          foundRootParent = true;
        } else if (!parentTrack.parent_track_id) {
          // If this track has no parent, it's the root
          rootParentId = currentParentId;
          foundRootParent = true;
        } else {
          // Move up the chain
          currentParentId = parentTrack.parent_track_id;
        }
      }
    }
    
    console.log("trackVersionService - Root parent track ID:", rootParentId);
    
    // Find all tracks in this version family (tracks with this root parent or the root itself)
    const { data: familyTracks, error: familyError } = await supabase
      .from('tracks')
      .select('id, version_number')
      .or(`id.eq.${rootParentId},parent_track_id.eq.${rootParentId}`);
      
    if (familyError) {
      console.error("trackVersionService - Error fetching version family:", familyError);
    }
    
    // Calculate the highest version number in the family
    let highestVersion = 1;
    if (familyTracks && familyTracks.length > 0) {
      highestVersion = Math.max(...familyTracks.map(t => t.version_number || 1));
    }
    
    // Set the new version number as highest + 1
    const newVersionNumber = highestVersion + 1;
    console.log("trackVersionService - Using new version number:", newVersionNumber);
    
    // Mark ALL tracks in this version family as not latest version
    if (rootParentId) {
      console.log("trackVersionService - Updating is_latest_version flag for all family tracks");
      
      // Update the root parent if it exists
      await supabase
        .from('tracks')
        .update({ is_latest_version: false })
        .eq('id', rootParentId);
        
      // Update all tracks with this root parent
      await supabase
        .from('tracks')
        .update({ is_latest_version: false })
        .eq('parent_track_id', rootParentId);
    }
    
    // Upload the new version with the same title but as a child of the original
    return await uploadTrack(
      file,
      originalTrack.title,
      onProgress,
      originalTrackId,  // Use the direct parent ID for parent_track_id
      versionNotes
    );
  } catch (error: any) {
    console.error("trackVersionService - Version creation error:", error);
    handleError(error, "Version Creation Failed", "There was an error creating a new version of your track");
    return null;
  }
};
