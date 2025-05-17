
import { supabase } from "@/integrations/supabase/client";
import { TrackData } from "@/types/track";
import { handleError } from "@/utils/errorHandler";
import { uploadTrack } from "./trackCreationService";

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
    const rootParentId = await findRootParentId(originalTrack.parent_track_id, originalTrackId);
    console.log("trackVersionService - Root parent track ID:", rootParentId);
    
    // Step 2: Get ALL related tracks in the version family - including all branches
    const allRelatedTracks = await getAllFamilyTracks(rootParentId);
    console.log("trackVersionService - Found family versions:", allRelatedTracks.length);
    
    // Log all related tracks for debugging
    console.log("trackVersionService - All related tracks:", 
      allRelatedTracks.map(t => ({ id: t.id, version: t.version_number })));
    
    // Step 3: Calculate the highest version number across ALL branches
    let highestVersion = 1;
    if (allRelatedTracks && allRelatedTracks.length > 0) {
      highestVersion = Math.max(...allRelatedTracks.map(t => t.version_number || 1));
      console.log("trackVersionService - Highest version found:", highestVersion);
    }
    
    // Set the new version number as highest + 1
    const newVersionNumber = highestVersion + 1;
    console.log("trackVersionService - Using new version number:", newVersionNumber);
    
    // Step 4: Mark ALL tracks in the family tree as not latest
    console.log("trackVersionService - Updating is_latest_version flag for all family tracks");
    await markAllRelatedTracksAsNotLatest(rootParentId);
    
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
 * Improved helper function to get ALL tracks in the version family tree
 * regardless of parent-child relationships or branching structure
 */
async function getAllFamilyTracks(rootParentId: string): Promise<{ id: string, version_number: number }[]> {
  if (!rootParentId) return [];
  
  const result: { id: string, version_number: number }[] = [];
  const processedTrackIds = new Set<string>();
  
  // Get the root track itself first
  const { data: rootTrack, error: rootError } = await supabase
    .from('tracks')
    .select('id, version_number')
    .eq('id', rootParentId)
    .single();
    
  if (!rootError && rootTrack) {
    result.push(rootTrack);
    processedTrackIds.add(rootTrack.id);
  }
  
  // Recursively get all descendants in the family tree
  await getAllRelatedTracks(rootParentId, result, processedTrackIds);
  
  return result;
}

/**
 * Improved recursive function to fetch ALL tracks in the family tree
 * Handles any branching structure of versions
 */
async function getAllRelatedTracks(
  trackId: string,
  results: { id: string, version_number: number }[],
  processedIds: Set<string>
): Promise<void> {
  // Get direct children
  const { data: children, error } = await supabase
    .from('tracks')
    .select('id, version_number')
    .eq('parent_track_id', trackId);
    
  if (error || !children) {
    return;
  }
  
  // Process each child
  for (const child of children) {
    // Skip if already processed (prevents infinite loops)
    if (processedIds.has(child.id)) {
      continue;
    }
    
    // Add child to results and mark as processed
    results.push(child);
    processedIds.add(child.id);
    
    // Recursively get descendants of this child
    await getAllRelatedTracks(child.id, results, processedIds);
  }
  
  // Find any other tracks that might have this track's parent as their parent
  // This handles "sibling" versions (multiple branches from the same parent)
  const { data: parentTrack, error: parentError } = await supabase
    .from('tracks')
    .select('parent_track_id')
    .eq('id', trackId)
    .single();
    
  if (!parentError && parentTrack && parentTrack.parent_track_id) {
    const { data: siblings, error: siblingsError } = await supabase
      .from('tracks')
      .select('id, version_number')
      .eq('parent_track_id', parentTrack.parent_track_id)
      .neq('id', trackId); // Exclude the current track
      
    if (!siblingsError && siblings) {
      for (const sibling of siblings) {
        if (processedIds.has(sibling.id)) {
          continue;
        }
        
        results.push(sibling);
        processedIds.add(sibling.id);
        
        // Also get all descendants of the siblings
        await getAllRelatedTracks(sibling.id, results, processedIds);
      }
    }
  }
}

/**
 * Improved helper function to mark all tracks in a family as not latest
 */
async function markAllRelatedTracksAsNotLatest(rootParentId: string): Promise<void> {
  if (!rootParentId) return;
  
  // Get all tracks in the family tree
  const allTracks = await getAllFamilyTracks(rootParentId);
  
  // Update each track to is_latest_version = false
  for (const track of allTracks) {
    await supabase
      .from('tracks')
      .update({ is_latest_version: false })
      .eq('id', track.id);
  }
  
  console.log(`trackVersionService - Updated ${allTracks.length} tracks to is_latest_version = false`);
}
