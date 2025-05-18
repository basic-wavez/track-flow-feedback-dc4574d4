
import { useState, useCallback, useRef, useEffect } from "react";
import { getTrack, getTrackVersions } from "@/services/trackQueryService";
import { TrackData, TrackVersion } from "@/types/track";
import { useAuth } from "@/context/AuthContext";

export const useTrackData = (resolvedTrackId: string | undefined) => {
  const { user } = useAuth();
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackVersions, setTrackVersions] = useState<TrackVersion[]>([]);
  
  // Track whether this component is mounted
  const isMountedRef = useRef(true);
  
  // Track whether we've already loaded this track
  const loadedTrackRef = useRef<string | null>(null);

  const loadTrack = useCallback(async () => {
    if (!resolvedTrackId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching track data for ID:", resolvedTrackId);
      const track = await getTrack(resolvedTrackId);
      
      // Early exit if component unmounted during async operation
      if (!isMountedRef.current) return;
      
      if (!track) {
        throw new Error(`Track not found for ID: ${resolvedTrackId}`);
      }
      
      console.log("Track data loaded:", track.id);
      setTrackData(track);
      
      // Mark this track as loaded
      loadedTrackRef.current = resolvedTrackId;
      
      if (track && user) {
        setIsOwner(track.user_id === user.id);
      }
      
      // Load track versions
      if (track) {
        console.log("Loading versions for track:", track.id);
        const versions = await getTrackVersions(track.id);
        console.log("Loaded versions:", versions.length, versions.map(v => ({ id: v.id, version: v.version_number })));
        
        // Convert TrackData[] to TrackVersion[]
        if (isMountedRef.current) {
          const versionsArray: TrackVersion[] = versions.map(v => ({
            id: v.id,
            version_number: v.version_number,
            version_notes: v.version_notes,
            is_latest_version: v.is_latest_version,
            created_at: v.created_at
          }));
          
          setTrackVersions(versionsArray);
        }
      }
    } catch (error: any) {
      console.error("Error loading track:", error);
      if (isMountedRef.current) {
        setTrackData(null);
        setError(error.message || "Error loading track");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [resolvedTrackId, user]);

  // Load track data when parameters change
  useEffect(() => {
    loadTrack();
  }, [loadTrack]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshTrack = useCallback(() => {
    loadTrack();
  }, [loadTrack]);

  return {
    trackData,
    isLoading,
    isOwner,
    error,
    trackVersions,
    refreshTrack
  };
};
