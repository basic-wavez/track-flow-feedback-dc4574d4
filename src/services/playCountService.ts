
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
      // For tracks, directly update the play count
      // Since there's no increment_track_play_count function, we'll handle it manually
      // First, get the current track to check if it exists
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .select('id')
        .eq('id', trackId)
        .single();
      
      if (trackError) throw trackError;
      
      // In a real application, we'd have a play_count column to increment
      // For now, we'll just log that the track was played
      console.log(`Track ${trackId} was played`);
    } else if (shareKey) {
      // First determine if this is a playlist share link or a track share link
      const { data: playlistShareData } = await supabase
        .from('playlist_share_links')
        .select('id')
        .eq('share_key', shareKey)
        .maybeSingle();
        
      if (playlistShareData) {
        // It's a playlist share link
        // Use raw SQL expression for the play_count increment
        const { error: updateError } = await supabase
          .from('playlist_share_links')
          .update({
            // Converting the result of sql template literal to a number with the unary plus operator
            play_count: +supabase.sql`play_count + 1`,
            last_played_at: new Date().toISOString()
          })
          .eq('share_key', shareKey);
          
        if (updateError) throw updateError;
      } else {
        // It's probably a track share link in the share_links table
        // Use raw SQL expression for the play_count increment
        const { error: updateError } = await supabase
          .from('share_links')
          .update({
            // Converting the result of sql template literal to a number with the unary plus operator
            play_count: +supabase.sql`play_count + 1`,
            last_played_at: new Date().toISOString()
          })
          .eq('share_key', shareKey);
          
        if (updateError) throw updateError;
      }
    }

    return true;
  } catch (error) {
    console.error("Error incrementing play count:", error);
    return false;
  }
};
