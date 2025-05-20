
import { useCallback } from "react";
import { startPlayTracking, endPlayTracking, cancelPlayTracking } from "@/services/playCountService";

export interface UsePlayCountTrackingProps {
  isPlaying: boolean;
  isSharedRoute: boolean;
  trackId: string | undefined;
  shareKey: string | undefined;
  user: any;
  audioRef: React.RefObject<HTMLAudioElement>;
}

/**
 * Hook that handles play count tracking for audio tracks
 */
export function usePlayCountTracking({
  isPlaying,
  isSharedRoute,
  trackId,
  shareKey,
  user,
  audioRef,
}: UsePlayCountTrackingProps) {
  
  // Start tracking play count when play begins
  const startTracking = useCallback(() => {
    // Only track plays if user is logged in or if we're on a shared route
    if (user || isSharedRoute) {
      // Start tracking play time for this track
      startPlayTracking(trackId || null, shareKey || null);
    }
  }, [isSharedRoute, trackId, shareKey, user]);
  
  // End tracking and potentially increment play count
  const endTracking = useCallback(async () => {
    // Only end tracking when user is authenticated or we're on a shared route
    if (user || isSharedRoute) {
      // Only end tracking when pausing if we've played for some time
      const audio = audioRef.current;
      if (audio && audio.currentTime > 2) {
        try {
          const incremented = await endPlayTracking();
          if (incremented) {
            console.log("Play count incremented successfully");
          }
        } catch (error) {
          console.error("Error handling play count:", error);
        }
      } else {
        cancelPlayTracking();
      }
    }
  }, [audioRef, isSharedRoute, user]);
  
  // Handle end of track specifically
  const handleTrackEnd = useCallback(() => {
    // Only track plays if user is logged in or if we're on a shared route
    if (user || isSharedRoute) {
      // Track has finished playing naturally, check if we should increment
      endPlayTracking()
        .then(incremented => {
          if (incremented) {
            console.log("Play count incremented after track finished");
          }
        })
        .catch(error => {
          console.error("Error handling play count at track end:", error);
        });
    }
  }, [isSharedRoute, user]);
  
  return {
    startTracking,
    endTracking,
    handleTrackEnd
  };
}
