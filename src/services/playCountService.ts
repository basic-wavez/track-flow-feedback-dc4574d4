
import { incrementPlayCount, isInServerCooldown } from "./trackShareService";

interface PlayTracker {
  startTime: number;
  trackId: string | null;
  shareKey: string | null;
  lastIncrementTime: number | null;
}

// Tracking state - not persisted between page reloads
const playTracker: PlayTracker = {
  startTime: 0,
  trackId: null,
  shareKey: null,
  lastIncrementTime: null
};

// Constants
const MIN_PLAY_DURATION_MS = 2000; // 2 seconds
const CLIENT_COOLDOWN_PERIOD_MS = 0; // Disabled for testing (was 600000 - 10 minutes)

/**
 * Starts tracking play time for a track
 * @param trackId ID of the track being played
 * @param shareKey Optional share key if accessed via share link
 */
export const startPlayTracking = (trackId: string | null, shareKey: string | null = null): void => {
  playTracker.startTime = Date.now();
  playTracker.trackId = trackId;
  playTracker.shareKey = shareKey;
  
  // Retrieve last increment time from local storage if available
  if (shareKey) {
    const storedData = localStorage.getItem(`play_count_${shareKey}`);
    if (storedData) {
      playTracker.lastIncrementTime = parseInt(storedData, 10);
    }
  }
  
  console.log("Started play tracking:", { trackId, shareKey, startTime: new Date(playTracker.startTime) });
};

/**
 * Ends tracking play time and increments play count if conditions are met
 */
export const endPlayTracking = async (): Promise<boolean> => {
  if (!playTracker.startTime || (!playTracker.trackId && !playTracker.shareKey)) {
    console.log("Tracking not started or invalid track/shareKey");
    return false;
  }
  
  const playDuration = Date.now() - playTracker.startTime;
  console.log("Play duration:", playDuration, "ms");
  
  // Check if play duration meets minimum requirement
  if (playDuration < MIN_PLAY_DURATION_MS) {
    console.log("Play duration too short, not incrementing count");
    return false;
  }
  
  // Client-side cooldown check disabled for testing
  console.log("Client-side cooldown disabled for testing");
  
  // If we have a share key, check server-side cooldown and increment the play count
  if (playTracker.shareKey) {
    try {
      // Server-side cooldown is now disabled in trackShareService.ts
      console.log("Incrementing play count for share key:", playTracker.shareKey);
      const success = await incrementPlayCount(playTracker.shareKey);
      
      if (success) {
        // Save last increment time to local storage
        const currentTime = Date.now();
        localStorage.setItem(`play_count_${playTracker.shareKey}`, currentTime.toString());
        playTracker.lastIncrementTime = currentTime;
        console.log("Play count incremented successfully and local storage updated");
        return true;
      } else {
        console.log("Failed to increment play count on server");
      }
    } catch (error) {
      console.error("Error incrementing play count:", error);
    }
  }
  
  return false;
};

/**
 * Cancels play tracking without incrementing count
 */
export const cancelPlayTracking = (): void => {
  playTracker.startTime = 0;
  console.log("Play tracking canceled");
};

/**
 * Check if a track should increment play count based on local storage
 * @param shareKey Share key to check
 * @returns Boolean indicating if the track is in client-side cooldown period
 */
export const isInCooldownPeriod = (shareKey: string): boolean => {
  // Cooldown disabled for testing
  return false;
};
