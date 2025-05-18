
/**
 * Utility functions for updating track processing status
 */

// Export the ProcessingFormat type to use in other files
export type ProcessingFormat = 'mp3' | 'opus' | 'all';

/**
 * Update track status to 'processing'
 * @param supabase The Supabase client
 * @param trackId The track ID to update
 * @param format The format being processed
 */
export async function updateTrackStatusToProcessing(
  supabase: any, 
  trackId: string, 
  format: ProcessingFormat
): Promise<void> {
  console.log(`Updating track ${trackId} status to processing for format: ${format}`);
  
  const updateData: Record<string, string> = {};
  
  if (format === 'all' || format === 'mp3') {
    updateData.processing_status = 'processing';
  }
  
  if (format === 'all' || format === 'opus') {
    updateData.opus_processing_status = 'processing';
  }
  
  const { error } = await supabase
    .from("tracks")
    .update(updateData)
    .eq("id", trackId);
  
  if (error) {
    console.error("Error updating track status to processing:", error);
    throw new Error("Failed to update track status");
  } else {
    console.log(`Updated track ${trackId} status to processing for format: ${format}`);
  }
}

/**
 * Update track status to 'failed'
 * @param supabase The Supabase client
 * @param trackId The track ID to update
 * @param format The format that failed processing
 */
export async function updateTrackStatusToFailed(
  supabase: any, 
  trackId: string, 
  format: ProcessingFormat
): Promise<void> {
  console.log(`Updating track ${trackId} status to failed for format: ${format}`);
  
  const updateData: Record<string, string> = {};
  
  if (format === 'all' || format === 'mp3') {
    updateData.processing_status = 'failed';
  }
  
  if (format === 'all' || format === 'opus') {
    updateData.opus_processing_status = 'failed';
  }
  
  const { error } = await supabase
    .from("tracks")
    .update(updateData)
    .eq("id", trackId);
  
  if (error) {
    console.error("Error updating track status to failed:", error);
    throw new Error("Failed to update track status");
  } else {
    console.log(`Updated track ${trackId} status to failed for format: ${format}`);
  }
}

/**
 * Update track with processed URLs after successful processing
 * @param supabase The Supabase client
 * @param trackId The track ID to update
 * @param format The format that was processed
 * @param mp3Url The MP3 URL to save
 * @param opusUrl The Opus URL to save
 */
export async function updateTrackWithProcessedUrls(
  supabase: any,
  trackId: string,
  format: ProcessingFormat,
  mp3Url?: string,
  opusUrl?: string
): Promise<void> {
  console.log(`Updating track ${trackId} with processed URLs:`, { mp3Url, opusUrl });
  
  const updateData: Record<string, any> = {};
  
  if (mp3Url && (format === 'all' || format === 'mp3')) {
    updateData.mp3_url = mp3Url;
    updateData.processing_status = 'completed';
    console.log(`MP3 processing completed for track: ${trackId}`);
  }
  
  if (opusUrl && (format === 'all' || format === 'opus')) {
    updateData.opus_url = opusUrl;
    updateData.opus_processing_status = 'completed';
    console.log(`Opus processing completed for track: ${trackId}`);
  }
  
  // Only proceed if we have data to update
  if (Object.keys(updateData).length === 0) {
    console.log(`No URLs to update for track ${trackId}`);
    return;
  }
  
  const { error } = await supabase
    .from("tracks")
    .update(updateData)
    .eq("id", trackId);
  
  if (error) {
    console.error("Error updating track with processed URLs:", error);
    throw new Error("Failed to update track with processed URLs");
  } else {
    console.log(`Successfully updated track ${trackId} with processed URLs`);
  }
}
