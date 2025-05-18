
import { useState, useCallback, useRef, useEffect } from "react";
import { getTrack, getTrackVersions } from "@/services/trackQueryService";
import { TrackData, TrackVersion } from "@/types/track";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

export const useTrackData = (resolvedTrackId: string | undefined) => {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [trackVersions, setTrackVersions] = useState<TrackVersion[]>([]);
  
  // Track whether this component is mounted
  const isMountedRef = useRef(true);

  // Use React Query for data fetching with proper error handling
  const { 
    data: trackData, 
    isLoading, 
    error,
    refetch
  } = useQuery<TrackData | null, Error>({
    queryKey: ['track', resolvedTrackId],
    queryFn: async () => {
      if (!resolvedTrackId) {
        return null;
      }
      
      console.log("Fetching track data for ID:", resolvedTrackId);
      const track = await getTrack(resolvedTrackId);
      
      // Early exit if component unmounted during async operation
      if (!isMountedRef.current) return null;
      
      if (!track) {
        throw new Error(`Track not found for ID: ${resolvedTrackId}`);
      }
      
      console.log("Track data loaded:", track.id);
      return track;
    },
    // Use React Query's built-in retry logic instead of custom cooldown
    retry: 1,
    retryDelay: 2000,
    enabled: !!resolvedTrackId, // Only run query when we have a track ID
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Effect to set ownership status when track data changes
  useEffect(() => {
    if (trackData && user) {
      setIsOwner(trackData.user_id === user.id);
    } else {
      setIsOwner(false);
    }
  }, [trackData, user]);

  // Effect to load track versions when track data is available
  useEffect(() => {
    const loadVersions = async () => {
      if (!trackData) return;
      
      try {
        console.log("Loading versions for track:", trackData.id);
        const versions = await getTrackVersions(trackData.id);
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
      } catch (err) {
        console.error("Error loading track versions:", err);
      }
    };
    
    loadVersions();
  }, [trackData]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshTrack = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    trackData,
    isLoading,
    isOwner,
    error: error?.message || null,
    trackVersions,
    refreshTrack
  };
};
