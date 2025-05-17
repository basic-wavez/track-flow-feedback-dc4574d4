import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { TrackData, TrackWithVersions, TrackVersion } from "@/types/track";

/**
 * Fetches a track by ID
 */
export const getTrack = async (trackId: string): Promise<TrackData | null> => {
  try {
    const { data: track, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();
      
    if (error) {
      throw error;
    }
    
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
 * Includes improved error handling and validation
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

    // Process tracks to create parent-child relationships
    const tracksMap: Record<string, TrackData> = {};
    const parentTracks: Record<string, TrackData> = {};
    
    // First pass: organize tracks into maps
    (data || []).forEach(track => {
      tracksMap[track.id] = track;
      
      // If track has no parent or is itself a parent, add to parentTracks
      if (!track.parent_track_id) {
        parentTracks[track.id] = track;
      }
    });
    
    // Second pass: group child tracks with their parents
    const groupedTracks: TrackWithVersions[] = [];
    
    // Process parent tracks first
    Object.values(parentTracks).forEach(parentTrack => {
      const versions: TrackVersion[] = [
        {
          id: parentTrack.id,
          version_number: parentTrack.version_number,
          version_notes: parentTrack.version_notes,
          is_latest_version: parentTrack.is_latest_version,
          created_at: parentTrack.created_at
        }
      ];
      
      // Find all versions of this track
      (data || []).forEach(track => {
        if (track.parent_track_id === parentTrack.id) {
          versions.push({
            id: track.id,
            version_number: track.version_number,
            version_notes: track.version_notes,
            is_latest_version: track.is_latest_version,
            created_at: track.created_at
          });
        }
      });
      
      // Sort versions by version number
      versions.sort((a, b) => b.version_number - a.version_number);
      
      groupedTracks.push({
        id: parentTrack.id,
        title: parentTrack.title,
        original_filename: parentTrack.original_filename,
        parent_track_id: null,
        created_at: parentTrack.created_at,
        downloads_enabled: parentTrack.downloads_enabled,
        processing_status: parentTrack.processing_status,
        versions,
        feedbackCount: feedbackCounts[parentTrack.id] || 0,
        showVersions: false
      });
    });
    
    // Now handle tracks that are new versions of other tracks
    (data || []).forEach(track => {
      if (track.parent_track_id) {
        // Skip if the parent is already in our data set
        if (tracksMap[track.parent_track_id]) {
          return;
        }
        
        // This is a child track whose parent we don't have in our data
        // Create a standalone entry for it
        groupedTracks.push({
          id: track.id,
          title: track.title,
          original_filename: track.original_filename,
          parent_track_id: track.parent_track_id,
          created_at: track.created_at,
          downloads_enabled: track.downloads_enabled,
          processing_status: track.processing_status,
          versions: [
            {
              id: track.id,
              version_number: track.version_number,
              version_notes: track.version_notes,
              is_latest_version: track.is_latest_version,
              created_at: track.created_at
            }
          ],
          feedbackCount: feedbackCounts[track.id] || 0,
          showVersions: false
        });
      }
    });
    
    // Sort grouped tracks by created_at of the most recent version
    groupedTracks.sort((a, b) => {
      const aDate = new Date(a.versions[0].created_at || "").getTime();
      const bDate = new Date(b.versions[0].created_at || "").getTime();
      return bDate - aDate; // Most recent first
    });
    
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
 * Gets all versions of a specific track by finding and traversing the entire version family tree
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
    
    // Step 1: Find the root parent track (the earliest ancestor)
    const rootParentId = await findRootParentId(track.parent_track_id, track.id);
    console.log("trackQueryService - Root parent track ID:", rootParentId);
    
    // Step 2: Get ALL related tracks in the version family tree
    const allFamilyTracks = await getAllFamilyTracks(rootParentId);
    console.log("trackQueryService - Found family versions:", allFamilyTracks.length);
    
    // Log all related tracks for debugging
    console.log("trackQueryService - All related tracks:", 
      allFamilyTracks.map(t => ({ id: t.id, version: t.version_number })));
    
    // Sort by version number (highest first)
    return allFamilyTracks.sort((a, b) => b.version_number - a.version_number);
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
 * Improved helper function to get ALL tracks in the version family tree
 * regardless of parent-child relationships or branching structure
 */
async function getAllFamilyTracks(rootParentId: string): Promise<TrackData[]> {
  if (!rootParentId) return [];
  
  const result: TrackData[] = [];
  const processedTrackIds = new Set<string>();
  
  // Get the root track itself first
  const { data: rootTrack, error: rootError } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', rootParentId)
    .single();
    
  if (!rootError && rootTrack) {
    result.push(rootTrack);
    processedTrackIds.add(rootTrack.id);
  }
  
  // Recursively get all descendants in the family tree
  await getAllRelatedTracks(rootParentId, result, processedTrackIds);
  
  return result;
}

/**
 * Improved recursive function to fetch ALL tracks in the family tree
 * Handles any branching structure of versions
 */
async function getAllRelatedTracks(
  trackId: string,
  results: TrackData[],
  processedIds: Set<string>
): Promise<void> {
  // Get direct children
  const { data: children, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('parent_track_id', trackId);
    
  if (error || !children) {
    return;
  }
  
  // Process each child
  for (const child of children) {
    // Skip if already processed (prevents infinite loops)
    if (processedIds.has(child.id)) {
      continue;
    }
    
    // Add child to results and mark as processed
    results.push(child);
    processedIds.add(child.id);
    
    // Recursively get descendants of this child
    await getAllRelatedTracks(child.id, results, processedIds);
  }
  
  // Find any other tracks that might have this track's parent as their parent
  // This handles "sibling" versions (multiple branches from the same parent)
  const { data: parentTrack, error: parentError } = await supabase
    .from('tracks')
    .select('parent_track_id')
    .eq('id', trackId)
    .single();
    
  if (!parentError && parentTrack && parentTrack.parent_track_id) {
    const { data: siblings, error: siblingsError } = await supabase
      .from('tracks')
      .select('*')
      .eq('parent_track_id', parentTrack.parent_track_id)
      .neq('id', trackId); // Exclude the current track
      
    if (!siblingsError && siblings) {
      for (const sibling of siblings) {
        if (processedIds.has(sibling.id)) {
          continue;
        }
        
        results.push(sibling);
        processedIds.add(sibling.id);
        
        // Also get all descendants of the siblings
        await getAllRelatedTracks(sibling.id, results, processedIds);
      }
    }
  }
}
