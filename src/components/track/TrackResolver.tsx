
import { useState, useEffect, useRef, useCallback } from "react";
import { getTrackIdByShareKey } from "@/services/trackShareService";
import { isValidTrackId, markInvalidTrackId } from "@/services/track/trackQueryUtils";

// This will store known bad track IDs to prevent repeated attempts to load them
const INVALID_TRACK_IDS = new Set<string>();

// Cooldown period in ms to prevent repeated fetch attempts
const ERROR_RETRY_COOLDOWN_MS = 30000; // 30 seconds

interface TrackResolverProps {
  trackId?: string;
  shareKey?: string;
  isShareRoute: boolean;
  onResolve: (resolvedId: string | null, error: string | null, shareKey?: string) => void;
}

const TrackResolver = ({ 
  trackId, 
  shareKey, 
  isShareRoute,
  onResolve 
}: TrackResolverProps) => {
  // Track failure rate to prevent infinite loops
  const failureCountRef = useRef(0);
  const lastErrorTimeRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  
  // Function to check if we're in error cooldown period
  const isInErrorCooldown = useCallback(() => {
    if (!lastErrorTimeRef.current) return false;
    return (Date.now() - lastErrorTimeRef.current) < ERROR_RETRY_COOLDOWN_MS;
  }, []);

  // Resolve track ID from share key if necessary
  useEffect(() => {
    const resolveTrack = async () => {
      try {
        // Skip loading if we're in error cooldown and have exceeded failure threshold
        if (isInErrorCooldown() && failureCountRef.current > 2) {
          console.log('TrackResolver: Skipping load during error cooldown');
          return;
        }

        let actualTrackId = trackId;
        
        // If we're on a share route, get the track ID from the share key
        if (isShareRoute && shareKey) {
          console.log("Loading track by share key:", shareKey);
          
          // Check if this share key has previously failed
          const cacheKey = `share_${shareKey}`;
          if (INVALID_TRACK_IDS.has(cacheKey)) {
            throw new Error(`Invalid share link: ${shareKey} (from cache)`);
          }
          
          actualTrackId = await getTrackIdByShareKey(shareKey);
          console.log("Resolved trackId from shareKey:", actualTrackId);
          
          if (!actualTrackId) {
            INVALID_TRACK_IDS.add(cacheKey); // Remember this bad share key
            throw new Error(`Invalid share link: ${shareKey}`);
          }
        }

        // Validate track ID format
        if (!actualTrackId) {
          throw new Error("No track ID provided");
        }
        
        // Perform basic UUID validation to prevent unnecessary requests
        if (!isValidTrackId(actualTrackId)) {
          INVALID_TRACK_IDS.add(actualTrackId);
          markInvalidTrackId(actualTrackId);
          throw new Error(`Invalid track ID format: ${actualTrackId}`);
        }
        
        // Check if this track ID is known to be invalid
        if (INVALID_TRACK_IDS.has(actualTrackId)) {
          throw new Error(`Track not found (from cache): ${actualTrackId}`);
        }

        // Reset error tracking on success
        failureCountRef.current = 0;
        lastErrorTimeRef.current = null;
        
        // Call the onResolve callback with the resolved track ID
        if (isMountedRef.current) {
          onResolve(actualTrackId, null, shareKey);
        }
      } catch (error: any) {
        // Track error rate
        failureCountRef.current += 1;
        lastErrorTimeRef.current = Date.now();
        
        console.error("Error resolving track:", error);
        if (isMountedRef.current) {
          onResolve(null, error.message || "Error resolving track", shareKey);
        }
      }
    };

    resolveTrack();

    return () => {
      isMountedRef.current = false;
    };
  }, [trackId, shareKey, isShareRoute, onResolve, isInErrorCooldown]);

  return null; // This is a logic-only component with no UI
};

export default TrackResolver;
