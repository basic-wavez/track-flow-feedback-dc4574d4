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
 * Gets all versions of a specific track
 */
export const getTrackVersions = async (trackId: string): Promise<TrackData[]> => {
  try {
    // First get the track to determine if it's a parent or child
    const track = await getTrack(trackId);
    if (!track) {
      return [];
    }
    
    let parentId = track.parent_track_id || track.id;
    
    // If this is a child track, use its parent_track_id
    if (track.parent_track_id) {
      parentId = track.parent_track_id;
    }
    
    // Get all versions of this track (parent and all children)
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .or(`id.eq.${parentId},parent_track_id.eq.${parentId}`)
      .order('version_number', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data || [];
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
