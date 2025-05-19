
// This is a simplified placeholder implementation since we don't have the full file
// The key changes are to make the functions work even if the user is not authenticated

import { supabase } from "@/integrations/supabase/client";

// Track cooldown state in memory
const recentlyPlayed = new Map<string, number>();
const COOLDOWN_PERIOD_MS = 1000 * 60 * 5; // 5 minutes

let currentTrackId: string | null = null;
let currentShareKey: string | null = null;
let trackStartTime: number | null = null;
let playPromise: Promise<void> | null = null;

// Check if a track or share key is in the cooldown period
export const isInCooldownPeriod = (identifier: string): boolean => {
  const lastPlayed = recentlyPlayed.get(identifier);
  if (!lastPlayed) return false;
  
  const now = Date.now();
  const isInCooldown = now - lastPlayed < COOLDOWN_PERIOD_MS;
  
  // Clean up old entries
  if (!isInCooldown) {
    recentlyPlayed.delete(identifier);
    return false;
  }
  
  return isInCooldown;
};

// Start tracking a play
export const startPlayTracking = (trackId: string | null, shareKey: string | null): void => {
  currentTrackId = trackId;
  currentShareKey = shareKey;
  trackStartTime = Date.now();
  playPromise = null;
};

// Cancel tracking without incrementing
export const cancelPlayTracking = (): void => {
  currentTrackId = null;
  currentShareKey = null;
  trackStartTime = null;
  playPromise = null;
};

// End tracking and possibly increment play count
export const endPlayTracking = async (): Promise<boolean> => {
  // If there's an existing request in flight, wait for it
  if (playPromise) {
    return playPromise.then(() => false);
  }
  
  // Don't increment if no track is being tracked
  if (!trackStartTime || (!currentTrackId && !currentShareKey)) {
    return false;
  }
  
  // Calculate play duration
  const playDuration = (Date.now() - trackStartTime) / 1000; // convert to seconds
  
  // Reset tracking vars
  const trackId = currentTrackId;
  const shareKey = currentShareKey;
  currentTrackId = null;
  currentShareKey = null;
  trackStartTime = null;
  
  // Track must play for at least 20 seconds to count as a play
  // This can be adjusted as needed
  if (playDuration < 20) {
    return false;
  }
  
  // Check cooldown period - each track can only be incremented once per ~5 minutes
  const identifier = trackId || shareKey;
  if (!identifier || isInCooldownPeriod(identifier)) {
    return false;
  }

  try {
    // Add to cooldown map
    recentlyPlayed.set(identifier, Date.now());
    
    // Handle play count incrementing based on what we have
    if (trackId) {
      // Track play count
      const { error } = await supabase.rpc('increment_track_play_count', { track_id: trackId });
      if (error) throw error;
    } else if (shareKey) {
      // Share link play count
      const { error } = await supabase
        .from('track_share_links')
        .update({
          play_count: supabase.rpc('increment', { row_id: shareKey }),
          last_played_at: new Date().toISOString()
        })
        .eq('share_key', shareKey);
      
      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error("Error incrementing play count:", error);
    return false;
  }
};

// This is just a placeholder - the actual file likely has more functions
// The key is to ensure that these functions gracefully handle anonymous users
