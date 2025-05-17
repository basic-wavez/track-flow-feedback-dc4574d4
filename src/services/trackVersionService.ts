
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
      .select('title, parent_track_id, version_number')
      .eq('id', originalTrackId)
      .single();
      
    if (fetchError) {
      console.error("trackVersionService - Error fetching original track:", fetchError);
      throw new Error("Could not find the original track");
    }
    
    // Step 1: Find the root parent track (the earliest ancestor)
    // This will be the base for our version family tree
    let rootParentId = await findRootParentId(originalTrack.parent_track_id, originalTrackId);
    console.log("trackVersionService - Root parent track ID:", rootParentId);
    
    // Step 2: Get ALL versions in the family tree - not just direct children
    // This includes finding all descendants with this root parent
    const familyTracks = await getAllFamilyVersions(rootParentId);
    console.log("trackVersionService - Found family versions:", familyTracks.length);
    
    // Step 3: Calculate the highest version number in the ENTIRE family tree
    let highestVersion = 1;
    if (familyTracks && familyTracks.length > 0) {
      highestVersion = Math.max(...familyTracks.map(t => t.version_number || 1));
    }
    
    // Set the new version number as highest + 1
    const newVersionNumber = highestVersion + 1;
    console.log("trackVersionService - Using new version number:", newVersionNumber);
    
    // Step 4: Mark ALL tracks in this version family as not latest version
    if (rootParentId) {
      console.log("trackVersionService - Updating is_latest_version flag for all family tracks");
      
      // Update the root parent if it exists
      await supabase
        .from('tracks')
        .update({ is_latest_version: false })
        .eq('id', rootParentId);
        
      // Update all descendants with this root parent recursively
      await markAllFamilyTracksAsNotLatest(rootParentId);
    }
    
    // Upload the new version with the same title but as a child of the original
    return await uploadTrack(
      file,
      originalTrack.title,
      onProgress,
      originalTrackId,  // Use the direct parent ID for parent_track_id
      versionNotes,
      newVersionNumber  // Pass the explicit version number
    );
  } catch (error: any) {
    console.error("trackVersionService - Version creation error:", error);
    handleError(error, "Version Creation Failed", "There was an error creating a new version of your track");
    return null;
  }
};

/**
 * Helper function to find the root parent of a track
 */
async function findRootParentId(parentTrackId?: string | null, fallbackId?: string): Promise<string> {
  // If no parent, return fallback (current track becomes root)
  if (!parentTrackId) {
    return fallbackId || '';
  }
  
  let currentParentId = parentTrackId;
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
      foundRootParent = true;
    } else {
      // Move up the chain
      currentParentId = parentTrack.parent_track_id;
    }
  }
  
  return currentParentId;
}

/**
 * Helper function to get all tracks in the version family
 */
async function getAllFamilyVersions(rootParentId: string): Promise<{ id: string, version_number: number }[]> {
  if (!rootParentId) return [];
  
  const result: { id: string, version_number: number }[] = [];
  
  // Get the root track itself
  const { data: rootTrack, error: rootError } = await supabase
    .from('tracks')
    .select('id, version_number')
    .eq('id', rootParentId)
    .single();
    
  if (!rootError && rootTrack) {
    result.push(rootTrack);
  }
  
  // Recursively get all descendants in the family tree
  await getDescendants(rootParentId, result);
  
  return result;
}

/**
 * Helper function to recursively fetch all descendants of a track
 */
async function getDescendants(parentId: string, results: { id: string, version_number: number }[]): Promise<void> {
  // Get direct children
  const { data: children, error } = await supabase
    .from('tracks')
    .select('id, version_number')
    .eq('parent_track_id', parentId);
    
  if (error || !children) {
    return;
  }
  
  // Add all children to results
  children.forEach(child => {
    results.push(child);
  });
  
  // Recursively get descendants of each child
  for (const child of children) {
    await getDescendants(child.id, results);
  }
}

/**
 * Helper function to mark all tracks in a family as not latest
 */
async function markAllFamilyTracksAsNotLatest(rootParentId: string): Promise<void> {
  // First get all tracks with this root parent
  const familyTracks = await getAllFamilyVersions(rootParentId);
  
  // Update all family tracks to is_latest_version = false
  for (const track of familyTracks) {
    await supabase
      .from('tracks')
      .update({ is_latest_version: false })
      .eq('id', track.id);
  }
}
