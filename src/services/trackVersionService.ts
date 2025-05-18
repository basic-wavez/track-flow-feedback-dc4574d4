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
    
    // Get the root parent ID (the earliest ancestor)
    const rootParentId = await findRootParentId(originalTrack.parent_track_id, originalTrackId);
    console.log("trackVersionService - Root parent track ID:", rootParentId);
    
    // Get the next version number using our new simplified approach
    const newVersionNumber = await getNextVersionNumber(rootParentId);
    console.log("trackVersionService - Using new version number:", newVersionNumber);
    
    // Mark ALL tracks in the family tree as not latest
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
 * Helper function to get the next version number
 * Counts all versions in the family and adds one
 */
async function getNextVersionNumber(rootParentId: string): Promise<number> {
  try {
    // Get all tracks in the family tree regardless of parent-child relationships
    const { data: familyTracks, error } = await supabase
      .from('tracks')
      .select('id')
      .or(`id.eq.${rootParentId},parent_track_id.eq.${rootParentId}`);
      
    if (error) {
      console.error("Error getting family tracks:", error);
      return 1; // Default to 1 if something goes wrong
    }
    
    // Recursive search for all descendants
    let allRelatedTrackIds = new Set<string>(familyTracks.map(t => t.id));
    const processedIds = new Set<string>([rootParentId]);
    
    // Process each track found to look for their children too
    for (const track of familyTracks) {
      if (track.id !== rootParentId) {
        await getAllDescendantTrackIds(track.id, allRelatedTrackIds, processedIds);
      }
    }
    
    // Return the count of all tracks in the family plus one for the new version
    const nextVersionNumber = allRelatedTrackIds.size + 1;
    console.log(`Found ${allRelatedTrackIds.size} related tracks, next version will be ${nextVersionNumber}`);
    return nextVersionNumber;
  } catch (error) {
    console.error("Error calculating next version number:", error);
    return 1; // Default to 1 if something goes wrong
  }
}

/**
 * Recursive helper to find ALL descendants of a track
 */
async function getAllDescendantTrackIds(
  trackId: string, 
  allTrackIds: Set<string>,
  processedIds: Set<string>
): Promise<void> {
  // Skip if already processed to prevent infinite loops
  if (processedIds.has(trackId)) return;
  
  // Mark as processed
  processedIds.add(trackId);
  
  // Find all tracks that have this track as parent
  const { data: childTracks, error } = await supabase
    .from('tracks')
    .select('id')
    .eq('parent_track_id', trackId);
    
  if (error || !childTracks || childTracks.length === 0) return;
  
  // Add all child tracks to the result set
  for (const child of childTracks) {
    allTrackIds.add(child.id);
    // Recursively get descendants of this child
    await getAllDescendantTrackIds(child.id, allTrackIds, processedIds);
  }
}

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
 * Helper function to mark all tracks in a family as not latest
 */
async function markAllRelatedTracksAsNotLatest(rootParentId: string): Promise<void> {
  if (!rootParentId) return;
  
  try {
    // First update the root parent itself
    await supabase
      .from('tracks')
      .update({ is_latest_version: false })
      .eq('id', rootParentId);
    
    // Then update all tracks that have this root as an ancestor
    // Start with direct children
    const { data: directChildren } = await supabase
      .from('tracks')
      .select('id')
      .eq('parent_track_id', rootParentId);
      
    if (directChildren && directChildren.length > 0) {
      // Update all direct children
      await supabase
        .from('tracks')
        .update({ is_latest_version: false })
        .in('id', directChildren.map(c => c.id));
        
      // Recursively update descendants of each direct child
      for (const child of directChildren) {
        await markAllChildrenNotLatest(child.id);
      }
    }
    
    console.log(`trackVersionService - Updated all tracks in family to is_latest_version = false`);
  } catch (error) {
    console.error("Error marking tracks as not latest:", error);
  }
}

/**
 * Recursive helper to mark all children as not latest
 */
async function markAllChildrenNotLatest(parentId: string): Promise<void> {
  const { data: children } = await supabase
    .from('tracks')
    .select('id')
    .eq('parent_track_id', parentId);
    
  if (!children || children.length === 0) return;
  
  // Update all children of this parent
  await supabase
    .from('tracks')
    .update({ is_latest_version: false })
    .in('id', children.map(c => c.id));
    
  // Recursively update descendants of each child
  for (const child of children) {
    await markAllChildrenNotLatest(child.id);
  }
}
