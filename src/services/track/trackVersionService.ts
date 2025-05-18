
import { supabase } from "@/integrations/supabase/client";
import { TrackData, TrackVersion } from "@/types/track";
import { findRootParentId, handleTrackQueryError } from "./trackQueryUtils";
import { getTrack } from "./trackFetcher";
import { useToast } from "@/components/ui/use-toast";

/**
 * Gets all versions of a specific track by finding the root parent and all related tracks
 */
export const getTrackVersions = async (trackId: string): Promise<TrackData[]> => {
  try {
    console.log("trackVersionService - Getting track versions for:", trackId);
    
    // First get the track to determine if it's a parent or child
    const track = await getTrack(trackId);
    if (!track) {
      console.error("trackVersionService - Track not found for ID:", trackId);
      return [];
    }
    
    // Find the root parent track (the earliest ancestor)
    const rootParentId = await findRootParentId(track.parent_track_id, track.id);
    console.log("trackVersionService - Root parent track ID:", rootParentId);
    
    // Get all family tracks using our simplified approach
    const familyTracks = await getAllFamilyTracks(rootParentId);
    console.log("trackVersionService - Found family versions:", 
      familyTracks.length,
      familyTracks.map(t => ({id: t.id, version: t.version_number}))
    );
    
    // Sort by version number (highest first)
    return familyTracks.sort((a, b) => b.version_number - a.version_number);
  } catch (error: any) {
    console.error("Error loading track versions:", error);
    useToast().toast({
      title: "Error Loading Versions",
      description: error.message || "Failed to load track versions",
      variant: "destructive",
    });
    return [];
  }
};

/**
 * Get all tracks in the family tree
 */
async function getAllFamilyTracks(rootParentId: string): Promise<TrackData[]> {
  if (!rootParentId) return [];
  
  try {
    // First get the root track itself
    const { data: rootTrack, error: rootError } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', rootParentId)
      .single();
      
    if (rootError || !rootTrack) {
      console.error("getAllFamilyTracks - Error getting root track:", rootError);
      return [];
    }
    
    // Initialize the result with the root track
    const result: TrackData[] = [rootTrack];
    
    // Get all tracks that have this as the root parent (direct children first)
    const { data: directChildren, error: childrenError } = await supabase
      .from('tracks')
      .select('*')
      .eq('parent_track_id', rootParentId);
      
    if (childrenError) {
      console.error("getAllFamilyTracks - Error getting direct children:", childrenError);
      return result; // Return just the root if we can't get children
    }
    
    // Add direct children to the result
    if (directChildren && directChildren.length > 0) {
      result.push(...directChildren);
      
      // Recursively get descendants of each direct child
      for (const child of directChildren) {
        const descendants = await getDescendantTracks(child.id);
        result.push(...descendants);
      }
    }
    
    console.log(`getAllFamilyTracks - Found ${result.length} tracks in the family`);
    return result;
  } catch (error) {
    console.error("getAllFamilyTracks - Error:", error);
    return [];
  }
}

/**
 * Get all descendant tracks of a given parent track
 */
async function getDescendantTracks(parentId: string): Promise<TrackData[]> {
  const result: TrackData[] = [];
  
  try {
    // Get direct children of this parent
    const { data: children, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('parent_track_id', parentId);
      
    if (error || !children || children.length === 0) {
      return result;
    }
    
    // Add children to result
    result.push(...children);
    
    // Recursively get descendants of each child
    for (const child of children) {
      const descendants = await getDescendantTracks(child.id);
      result.push(...descendants);
    }
    
    return result;
  } catch (error) {
    console.error(`getDescendantTracks - Error getting descendants for ${parentId}:`, error);
    return result;
  }
}
