
import { supabase } from "@/integrations/supabase/client";
import { getTrack } from "./trackFetcher";

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
