
import { supabase } from "@/integrations/supabase/client";
import { TrackData } from "@/types/track";
import { toast } from "@/hooks/use-toast"; // Import directly from hooks to avoid circular deps

// Track failed attempts to prevent infinite loops
export const failedFetchAttempts = new Map<string, { count: number, lastAttempt: number }>();
export const MAX_FETCH_ATTEMPTS = 3;
export const FETCH_COOLDOWN_MS = 5000; // 5 seconds cooldown

// Track invalid IDs to avoid repeated fetching
const invalidTrackIds = new Set<string>();

/**
 * Check if a track ID is valid UUID format
 */
export const isValidTrackId = (trackId: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trackId);
};

/**
 * Marks a track ID as invalid to prevent repeated fetching
 */
export const markInvalidTrackId = (trackId: string): void => {
  invalidTrackIds.add(trackId);
};

/**
 * Checks if a track ID has been marked as invalid
 */
export const isInvalidTrackId = (trackId: string): boolean => {
  return invalidTrackIds.has(trackId);
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
  let maxDepth = 10; // Prevent infinite loops
  
  // Traverse up the parent chain to find the root parent
  while (!foundRootParent && maxDepth > 0) {
    maxDepth--;
    
    try {
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
    } catch (err) {
      console.error('Error finding root parent:', err);
      foundRootParent = true; // Exit the loop on error
    }
  }
  
  return currentParentId;
}

/**
 * Handles track query errors and prevents toast spam
 */
export function handleTrackQueryError(error: any, trackId: string): null {
  console.error(`Failed to fetch track ${trackId}:`, error);
  
  // Mark this ID as invalid
  if (!isValidTrackId(trackId)) {
    markInvalidTrackId(trackId);
  }
  
  // Don't show toast if we're in cooldown to avoid toast spam
  const failRecord = failedFetchAttempts.get(trackId);
  const toastShown = failRecord && failRecord.count > MAX_FETCH_ATTEMPTS;
  
  // Import from @/utils/trackDataCache in an async way to avoid circular dependency
  import('@/utils/trackDataCache').then(({ isRecentVisibilityChange }) => {
    // Only show toast if not a tab switch and not already shown too many times
    if (!isRecentVisibilityChange() && !toastShown) {
      toast({
        title: "Error Loading Track",
        description: error.message || "Failed to load track details",
        variant: "destructive",
      });
    }
  }).catch(() => {
    // Fallback if import fails
    if (!toastShown) {
      toast({
        title: "Error Loading Track",
        description: error.message || "Failed to load track details",
        variant: "destructive",
      });
    }
  });
  
  return null;
}
