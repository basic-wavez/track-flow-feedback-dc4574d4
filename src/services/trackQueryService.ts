
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { TrackData, TrackWithVersions, TrackVersion } from "@/types/track";
import { cacheTrackData, getCachedTrackData, isRecentVisibilityChange } from "@/utils/trackDataCache";

/**
 * Fetches a track by ID
 */
export const getTrack = async (trackId: string): Promise<TrackData | null> => {
  try {
    // Check cache first
    const cacheKey = `track_${trackId}`;
    const cachedData = getCachedTrackData(cacheKey);
    
    // Return cached data if this is a tab visibility change
    if (cachedData && isRecentVisibilityChange()) {
      console.log('Using cached track data for tab switch:', trackId);
      return cachedData;
    }
    
    const { data: track, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();
      
    if (error) {
      throw error;
    }
    
    // Cache the result
    cacheTrackData(cacheKey, track);
    
    return track;
  } catch (error: any) {
    toast({
      title: "Error Loading Track",
      description: error.message || "Failed to load track details",
      variant: "destructive",
    });
    return null;
  }
};

/**
 * Fetches all chunks for a track and returns their URLs
 */
export const getTrackChunkUrls = async (trackId: string): Promise<string[]> => {
  try {
    // First, get the track details
    const track = await getTrack(trackId);
    if (!track) {
      throw new Error("Track not found");
    }
    
    // If track has a processed MP3, return it as the only "chunk"
    if (track.mp3_url && track.processing_status === 'completed') {
      console.log("Using processed MP3:", track.mp3_url);
      return [track.mp3_url];
    }
    
    // If track doesn't have chunks or just one chunk, return main URL
    if (!track.chunk_count || track.chunk_count <= 1) {
      return [track.compressed_url];
    }
    
    // Extract base path from the compressed_url
    const baseUrl = track.compressed_url;
    const chunkUrls: string[] = []; 
    
    // The baseUrl should be chunk_0
    if (!baseUrl.includes('_chunk_')) {
      // If the URL doesn't contain '_chunk_', it might be a legacy track
      console.log("This appears to be a non-chunked track:", baseUrl);
      return [baseUrl];
    }
    
    // Extract the base path (everything before _chunk_X)
    const basePath = baseUrl.split('_chunk_0')[0];
    
    // Check if the first chunk URL is valid
    const firstChunkUrl = `${basePath}_chunk_0`;
    let isFirstChunkValid = false;
    
    try {
      // Try to validate the first chunk URL format
      const { data: firstChunkData } = await supabase.storage
        .from('audio')
        .getPublicUrl(firstChunkUrl.split('/public/audio/')[1]);
        
      chunkUrls.push(firstChunkData.publicUrl);
      isFirstChunkValid = true;
    } catch (error) {
      console.error("Error validating first chunk:", error);
      // Fall back to the original URL if validation fails
      chunkUrls.push(baseUrl);
    }
    
    // If first chunk validation failed, don't try to get other chunks
    if (!isFirstChunkValid) {
      console.warn("First chunk validation failed, using original URL only");
      return [baseUrl];
    }
    
    // For each additional chunk, construct its URL and validate it
    for (let i = 1; i < track.chunk_count; i++) {
      try {
        const chunkPath = `${basePath}_chunk_${i}`.split('/public/audio/')[1];
        
        // Verify chunk exists in storage and get its public URL
        const { data } = await supabase.storage
          .from('audio')
          .getPublicUrl(chunkPath);
          
        chunkUrls.push(data.publicUrl);
        console.log(`Added chunk ${i}:`, data.publicUrl);
      } catch (error) {
        console.error(`Error getting URL for chunk ${i}:`, error);
        // Don't break the whole process if one chunk fails
        // Instead, log the error and continue
      }
    }
    
    console.log(`Retrieved ${chunkUrls.length}/${track.chunk_count} chunk URLs`);
    
    // If we didn't get any valid chunk URLs, fall back to the original URL
    if (chunkUrls.length === 0) {
      return [baseUrl];
    }
    
    return chunkUrls;
  } catch (error: any) {
    console.error("Error fetching chunk URLs:", error);
    return [];
  }
};

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
    toast({
      title: "Error Loading Tracks",
      description: error.message || "Failed to load your tracks",
      variant: "destructive",
    });
    return [];
  }
};

/**
 * Gets all versions of a specific track by finding the root parent and all related tracks
 */
export const getTrackVersions = async (trackId: string): Promise<TrackData[]> => {
  try {
    console.log("trackQueryService - Getting track versions for:", trackId);
    
    // First get the track to determine if it's a parent or child
    const track = await getTrack(trackId);
    if (!track) {
      console.error("trackQueryService - Track not found for ID:", trackId);
      return [];
    }
    
    // Find the root parent track (the earliest ancestor)
    const rootParentId = await findRootParentId(track.parent_track_id, track.id);
    console.log("trackQueryService - Root parent track ID:", rootParentId);
    
    // Get all family tracks using our simplified approach
    const familyTracks = await getAllFamilyTracks(rootParentId);
    console.log("trackQueryService - Found family versions:", 
      familyTracks.length,
      familyTracks.map(t => ({id: t.id, version: t.version_number}))
    );
    
    // Sort by version number (highest first)
    return familyTracks.sort((a, b) => b.version_number - a.version_number);
  } catch (error: any) {
    console.error("Error loading track versions:", error);
    toast({
      title: "Error Loading Versions",
      description: error.message || "Failed to load track versions",
      variant: "destructive",
    });
    return [];
  }
};

/**
 * Helper function to find the root parent of a track
 */
async function findRootParentId(parentTrackId?: string | null, fallbackId?: string): Promise<string> {
  // If no parent, return fallback (current track becomes root)
  if (!parentTrackId) {
    return fallbackId || '';
  }
  
  let currentParentId = parentTrackId;
  let foundRootParent = false;
  
  // Traverse up the parent chain to find the root parent
  while (!foundRootParent) {
    const { data: parentTrack, error: parentError } = await supabase
      .from('tracks')
      .select('parent_track_id')
      .eq('id', currentParentId)
      .single();
      
    if (parentError || !parentTrack) {
      // If we can't get the parent, use the current ID as root
      foundRootParent = true;
    } else if (!parentTrack.parent_track_id) {
      // If this track has no parent, it's the root
      foundRootParent = true;
    } else {
      // Move up the chain
      currentParentId = parentTrack.parent_track_id;
    }
  }
  
  return currentParentId;
}

/**
 * Simplified function to get ALL tracks in the family tree
 */
async function getAllFamilyTracks(rootParentId: string): Promise<TrackData[]> {
  if (!rootParentId) return [];
  
  try {
    // First get the root track itself
    const { data: rootTrack, error: rootError } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', rootParentId)
      .single();
      
    if (rootError || !rootTrack) {
      console.error("getAllFamilyTracks - Error getting root track:", rootError);
      return [];
    }
    
    // Initialize the result with the root track
    const result: TrackData[] = [rootTrack];
    
    // Get all tracks that have this as the root parent (direct children first)
    const { data: directChildren, error: childrenError } = await supabase
      .from('tracks')
      .select('*')
      .eq('parent_track_id', rootParentId);
      
    if (childrenError) {
      console.error("getAllFamilyTracks - Error getting direct children:", childrenError);
      return result; // Return just the root if we can't get children
    }
    
    // Add direct children to the result
    if (directChildren && directChildren.length > 0) {
      result.push(...directChildren);
      
      // Recursively get descendants of each direct child
      for (const child of directChildren) {
        const descendants = await getDescendantTracks(child.id);
        result.push(...descendants);
      }
    }
    
    console.log(`getAllFamilyTracks - Found ${result.length} tracks in the family`);
    return result;
  } catch (error) {
    console.error("getAllFamilyTracks - Error:", error);
    return [];
  }
}

/**
 * Get all descendant tracks of a given parent track
 */
async function getDescendantTracks(parentId: string): Promise<TrackData[]> {
  const result: TrackData[] = [];
  
  try {
    // Get direct children of this parent
    const { data: children, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('parent_track_id', parentId);
      
    if (error || !children || children.length === 0) {
      return result;
    }
    
    // Add children to result
    result.push(...children);
    
    // Recursively get descendants of each child
    for (const child of children) {
      const descendants = await getDescendantTracks(child.id);
      result.push(...descendants);
    }
    
    return result;
  } catch (error) {
    console.error(`getDescendantTracks - Error getting descendants for ${parentId}:`, error);
    return result;
  }
}
