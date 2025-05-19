
import { useState, useEffect, useCallback } from "react";
import { getTrack, getTrackVersions } from "@/services/trackQueryService";
import { getTrackIdByShareKey } from "@/services/trackShareService";
import { TrackData, TrackVersion } from "@/types/track";

interface UseTrackDataOptions {
  trackId?: string;
  shareKey?: string;
  isShareRoute?: boolean;
  userId?: string;
}

interface TrackDataResult {
  trackData: TrackData | null;
  isLoading: boolean;
  isOwner: boolean;
  error: string | null;
  currentShareKey?: string;
  resolvedTrackId?: string;
  trackVersions: TrackVersion[];
  refreshTrackData: () => void;
}

export const useTrackData = ({ 
  trackId: initialTrackId, 
  shareKey: initialShareKey,
  isShareRoute,
  userId
}: UseTrackDataOptions): TrackDataResult => {
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentShareKey, setCurrentShareKey] = useState<string | undefined>(initialShareKey);
  const [resolvedTrackId, setResolvedTrackId] = useState<string | undefined>(initialTrackId);
  const [trackVersions, setTrackVersions] = useState<TrackVersion[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refreshTrackData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Skip loading when the tab is hidden to prevent duplicate fetches
    if (document.visibilityState === 'hidden') {
      return;
    }
    
    const loadTrack = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Extract parameters based on route type
        let trackId = initialTrackId;
        let shareKey = initialShareKey;
        
        if (shareKey) {
          console.log("Using provided share key:", shareKey);
          setCurrentShareKey(shareKey);
        }
        
        console.log("TrackView loading with params:", { trackId, shareKey, isShareRoute });
        let actualTrackId = trackId;
        
        // If we're on a share route, get the track ID from the share key
        if (isShareRoute && shareKey) {
          console.log("Loading track by share key:", shareKey);
          actualTrackId = await getTrackIdByShareKey(shareKey);
          console.log("Resolved trackId from shareKey:", actualTrackId);
          
          if (!actualTrackId) {
            console.error("No track ID found for share key:", shareKey);
            setError(`Invalid share link: ${shareKey}`);
            setTrackData(null);
            setIsLoading(false);
            return;
          }
        }

        if (!actualTrackId) {
          console.error("No track ID available after processing parameters");
          setError("Invalid track ID");
          setTrackData(null);
          setIsLoading(false);
          return;
        }

        // Store the resolved track ID in state for use throughout the component
        setResolvedTrackId(actualTrackId);

        console.log("Fetching track data for ID:", actualTrackId);
        const track = await getTrack(actualTrackId);
        
        if (!track) {
          console.error("Track not found for ID:", actualTrackId);
          setError("Track not found");
          setTrackData(null);
          setIsLoading(false);
          return;
        }
        
        console.log("Track data loaded:", track.id);
        setTrackData(track);
        
        if (track && userId) {
          setIsOwner(track.user_id === userId);
        }
        
        // Load track versions using our improved function
        if (track) {
          console.log("Loading versions for track:", track.id);
          const versions = await getTrackVersions(track.id);
          console.log("Loaded versions:", versions.length, versions.map(v => ({ id: v.id, version: v.version_number })));
          
          // Convert TrackData[] to TrackVersion[]
          const versionsArray: TrackVersion[] = versions.map(v => ({
            id: v.id,
            version_number: v.version_number,
            version_notes: v.version_notes,
            is_latest_version: v.is_latest_version,
            created_at: v.created_at
          }));
          
          setTrackVersions(versionsArray);
        }
      } catch (error) {
        console.error("Error loading track:", error);
        setTrackData(null);
        setError("Error loading track");
      } finally {
        setIsLoading(false);
      }
    };

    loadTrack();
  }, [initialTrackId, isShareRoute, userId, refreshKey, initialShareKey]);

  return {
    trackData,
    isLoading,
    isOwner,
    error,
    currentShareKey,
    resolvedTrackId,
    trackVersions,
    refreshTrackData
  };
};
