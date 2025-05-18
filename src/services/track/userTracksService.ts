
import { supabase } from "@/integrations/supabase/client";
import { TrackData, TrackWithVersions, TrackVersion } from "@/types/track";
import { cacheTrackData, getCachedTrackData } from "@/utils/trackDataCache";
import { isRecentVisibilityChange } from "@/hooks/useVisibilityChange";
import { toast } from "@/hooks/use-toast"; // Fixed import path
import { findRootParentId } from "./trackQueryUtils";

// Store last toast time for rate limiting
const TOAST_COOLDOWN_MS = 10000;
let lastErrorToastTime = 0;

/**
 * Fetches all tracks for the current user with version grouping
 */
export const getUserTracks = async (): Promise<TrackWithVersions[]> => {
  try {
    // Check if this is a tab visibility change - use cache if available
    const cacheKey = 'user_tracks';
    const cachedTracks = getCachedTrackData(cacheKey);
    
    if (cachedTracks && isRecentVisibilityChange()) {
      console.log('Using cached user tracks for tab switch');
      return cachedTracks;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }
    
    // Fetch all tracks for the user
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }

    // Get feedback counts for tracks
    const trackIds = (data || []).map(track => track.id);
    let feedbackCounts: Record<string, number> = {};

    if (trackIds.length > 0) {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('track_id')
        .in('track_id', trackIds);
        
      if (!feedbackError && feedbackData) {
        // Count feedback per track
        feedbackData.forEach(item => {
          if (!feedbackCounts[item.track_id]) {
            feedbackCounts[item.track_id] = 0;
          }
          feedbackCounts[item.track_id]++;
        });
      }
    }

    // Find all root tracks (tracks without parents)
    const rootTracks = (data || []).filter(track => !track.parent_track_id);
    
    // Create a map of all tracks by ID for quick lookup
    const tracksById: Record<string, TrackData> = {};
    (data || []).forEach(track => {
      tracksById[track.id] = track;
    });
    
    // Group all tracks by their root parent
    const tracksByRootParent: Record<string, TrackData[]> = {};
    
    // First, for each track, find its root parent
    for (const track of (data || [])) {
      // If it's a root track, use its own ID as the root parent ID
      if (!track.parent_track_id) {
        if (!tracksByRootParent[track.id]) {
          tracksByRootParent[track.id] = [];
        }
        tracksByRootParent[track.id].push(track);
        continue;
      }
      
      // Otherwise, find the root parent
      const rootParentId = await findRootParentId(track.parent_track_id);
      if (!tracksByRootParent[rootParentId]) {
        tracksByRootParent[rootParentId] = [];
      }
      tracksByRootParent[rootParentId].push(track);
    }
    
    // Now create the TrackWithVersions objects
    const groupedTracks: TrackWithVersions[] = [];
    
    // Process each root parent
    for (const rootParentId of Object.keys(tracksByRootParent)) {
      // Get the root track
      const rootTrack = tracksById[rootParentId];
      
      // Skip if we somehow don't have the root track
      if (!rootTrack) continue;
      
      // Get all versions of this track family
      const versions: TrackVersion[] = tracksByRootParent[rootParentId].map(track => ({
        id: track.id,
        version_number: track.version_number,
        version_notes: track.version_notes,
        is_latest_version: track.is_latest_version,
        created_at: track.created_at
      }));
      
      // Sort versions by version number (highest first)
      versions.sort((a, b) => b.version_number - a.version_number);
      
      // Find the latest version
      const latestVersion = versions.find(v => v.is_latest_version) || versions[0];
      
      // Create the TrackWithVersions object
      groupedTracks.push({
        id: rootTrack.id,
        title: rootTrack.title,
        original_filename: rootTrack.original_filename,
        parent_track_id: null,
        created_at: latestVersion.created_at || rootTrack.created_at,
        downloads_enabled: rootTrack.downloads_enabled,
        processing_status: rootTrack.processing_status,
        versions,
        feedbackCount: feedbackCounts[rootTrack.id] || 0,
        showVersions: false
      });
    }
    
    // Sort grouped tracks by created_at of the most recent version
    groupedTracks.sort((a, b) => {
      const aDate = new Date(a.versions[0]?.created_at || a.created_at || "").getTime();
      const bDate = new Date(b.versions[0]?.created_at || b.created_at || "").getTime();
      return bDate - aDate; // Most recent first
    });
    
    // Only log if this isn't a tab visibility change
    if (!isRecentVisibilityChange()) {
      console.log("getUserTracks - Loaded from API:", 
        groupedTracks.map(t => ({
          id: t.id,
          title: t.title,
          versionCount: t.versions.length,
          versions: t.versions.map(v => v.version_number)
        }))
      );
    }
    
    // Cache the result
    cacheTrackData(cacheKey, groupedTracks);
    
    return groupedTracks;
  } catch (error: any) {
    console.error("Error loading tracks:", error);
    
    // Rate limit toasts to prevent flood
    const now = Date.now();
    if (now - lastErrorToastTime > TOAST_COOLDOWN_MS) {
      lastErrorToastTime = now;
      toast({
        title: "Error Loading Tracks",
        description: error.message || "Failed to load your tracks",
        variant: "destructive",
      });
    }
    
    return [];
  }
};
