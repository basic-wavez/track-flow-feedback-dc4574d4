
import { supabase } from "@/integrations/supabase/client";
import { TrackData } from "@/types/track";
import { 
  cacheTrackData, 
  getCachedTrackData 
} from "@/utils/trackDataCache";
import { isRecentVisibilityChange } from "@/hooks/useVisibilityChange";
import { 
  failedFetchAttempts, 
  MAX_FETCH_ATTEMPTS, 
  FETCH_COOLDOWN_MS, 
  handleTrackQueryError,
  isValidTrackId,
  isInvalidTrackId,
  markInvalidTrackId
} from "./trackQueryUtils";

/**
 * Fetches a track by ID with improved error handling and debouncing
 */
export const getTrack = async (trackId: string): Promise<TrackData | null> => {
  try {
    // Validate track ID format first to fail fast
    if (!trackId || !isValidTrackId(trackId)) {
      console.error(`Invalid track ID format: ${trackId}`);
      markInvalidTrackId(trackId);
      return null;
    }
    
    // Check if this ID is known to be invalid
    if (isInvalidTrackId(trackId)) {
      console.log(`Track ID is known to be invalid, skipping fetch: ${trackId}`);
      return null;
    }
    
    // Reset fetch attempts if it's been more than the cooldown period
    const now = Date.now();
    const failRecord = failedFetchAttempts.get(trackId);
    
    if (failRecord) {
      // If we've exceeded max attempts and we're still in cooldown, return null
      if (failRecord.count >= MAX_FETCH_ATTEMPTS && 
          now - failRecord.lastAttempt < FETCH_COOLDOWN_MS) {
        console.log(`Too many failed attempts for track ${trackId}, in cooldown period`);
        return null;
      }
      
      // Reset fail count if we're out of cooldown
      if (now - failRecord.lastAttempt > FETCH_COOLDOWN_MS) {
        failedFetchAttempts.delete(trackId);
      }
    }
    
    // Check cache first
    const cacheKey = `track_${trackId}`;
    const cachedData = getCachedTrackData(cacheKey);
    
    // Return cached data if this is a tab visibility change or we have a cached version
    if (cachedData) {
      if (isRecentVisibilityChange()) {
        console.log('Using cached track data for tab switch:', trackId);
        return cachedData;
      } else {
        // Still return cache but don't log, will refetch in background
        console.log('Using cached track data while fetching fresh data:', trackId);
      }
    }
    
    const { data: track, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();
      
    if (error) {
      // Track the failed attempt
      const currentFails = failedFetchAttempts.get(trackId);
      failedFetchAttempts.set(trackId, {
        count: currentFails ? currentFails.count + 1 : 1,
        lastAttempt: now
      });
      
      throw error;
    }
    
    // Reset failed attempts on success
    failedFetchAttempts.delete(trackId);
    
    // Cache the result
    cacheTrackData(cacheKey, track);
    
    return track;
  } catch (error: any) {
    return handleTrackQueryError(error, trackId);
  }
};
