
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// Define a type for the processing format
export type ProcessingFormat = 'mp3' | 'opus' | 'all';

/**
 * Update track status to processing
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
  
  const { error: updateError } = await supabase
    .from('tracks')
    .update(updateData)
    .eq('id', trackId);
  
  if (updateError) {
    console.error(`Error updating track status: ${updateError.message}`);
    throw new Error(`Failed to update track status: ${updateError.message}`);
  }
  
  console.log(`Updated track ${trackId} status to processing for format: ${format}`);
}

/**
 * Update track status to completed and set processed URLs
 */
export async function updateTrackWithProcessedUrls(
  supabase: any,
  trackId: string,
  format: ProcessingFormat,
  mp3Url: string | null,
  opusUrl: string | null,
  waveformPeaksUrl: string | null
): Promise<void> {
  console.log(`Updating track ${trackId} with processed URLs:`, {
    mp3Url,
    opusUrl,
    waveformPeaksUrl
  });
  
  const updateData: Record<string, any> = {};
  
  if ((format === 'all' || format === 'mp3') && mp3Url) {
    updateData.mp3_url = mp3Url;
    updateData.processing_status = 'completed';
    console.log(`MP3 URL saved for track: ${trackId}`);
  }
  
  if ((format === 'all' || format === 'opus') && opusUrl) {
    updateData.opus_url = opusUrl;
    updateData.opus_processing_status = 'completed';
    console.log(`Opus URL saved for track: ${trackId}`);
  }
  
  // Always update waveform peaks URL if provided
  if (waveformPeaksUrl) {
    updateData.waveform_peaks_url = waveformPeaksUrl;
    console.log(`Waveform peaks URL saved for track: ${trackId}`);
  }
  
  const { error: updateError } = await supabase
    .from('tracks')
    .update(updateData)
    .eq('id', trackId);
  
  if (updateError) {
    console.error(`Error updating track with processed URLs: ${updateError.message}`);
    throw new Error(`Failed to update track with processed URLs: ${updateError.message}`);
  }
  
  console.log(`Successfully updated track ${trackId} with processed URLs`);
}

/**
 * Update track status to failed
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
  
  const { error: updateError } = await supabase
    .from('tracks')
    .update(updateData)
    .eq('id', trackId);
  
  if (updateError) {
    console.error(`Error updating track status to failed: ${updateError.message}`);
  }
  
  console.log(`Updated track ${trackId} status to failed for format: ${format}`);
}
