
import { supabase } from "@/integrations/supabase/client";
import { TrackData } from "@/types/track";
import { useToast } from "@/hooks/use-toast";

// Track failed attempts to prevent infinite loops
export const failedFetchAttempts = new Map<string, { count: number, lastAttempt: number }>();
export const MAX_FETCH_ATTEMPTS = 3;
export const FETCH_COOLDOWN_MS = 5000; // 5 seconds cooldown

// Cache recent visibility changes to avoid unnecessary fetches
// This needs to be moved to trackDataCache.ts to fix circular dependency
export const lastVisibilityChange = {
  timestamp: 0,
  isVisible: true
};

/**
 * Helper function to find the root parent of a track
 */
export async function findRootParentId(parentTrackId?: string | null, fallbackId?: string): Promise<string> {
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
 * Handles track query errors and prevents toast spam
 */
export function handleTrackQueryError(error: any, trackId: string): null {
  console.error(`Failed to fetch track ${trackId}:`, error);
  
  // Don't show toast if we're in cooldown to avoid toast spam
  const failRecord = failedFetchAttempts.get(trackId);
  if (!failRecord || failRecord.count <= MAX_FETCH_ATTEMPTS) {
    // Import visibility check from trackDataCache to fix circular dependency
    const { isRecentVisibilityChange } = require("@/utils/trackDataCache");
    
    if (!isRecentVisibilityChange()) {
      // Only show toast if not a tab switch
      useToast().toast({
        title: "Error Loading Track",
        description: error.message || "Failed to load track details",
        variant: "destructive",
      });
    }
  }
  
  return null;
}
