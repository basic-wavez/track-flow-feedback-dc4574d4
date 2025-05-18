
/**
 * Utility functions for managing track processing status
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

export type ProcessingFormat = 'mp3' | 'opus' | 'all';
export type ProcessingStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';

/**
 * Update track status to processing
 * @param supabase Supabase client
 * @param trackId Track ID
 * @param format Processing format
 */
export async function updateTrackStatusToProcessing(
  supabase: any, 
  trackId: string, 
  format: ProcessingFormat
): Promise<void> {
  const updateData: Record<string, ProcessingStatus> = {};
  
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
    console.error(`Error updating track ${trackId} status to processing:`, error);
    throw new Error(`Failed to update track status to processing: ${error.message}`);
  }
  
  console.log(`Updated track ${trackId} status to processing for format: ${format}`);
}

/**
 * Update track status to failed
 * @param supabase Supabase client
 * @param trackId Track ID
 * @param format Processing format
 */
export async function updateTrackStatusToFailed(
  supabase: any, 
  trackId: string, 
  format: ProcessingFormat
): Promise<void> {
  try {
    const updateData: Record<string, ProcessingStatus> = {};
    
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
      console.error(`Error updating track ${trackId} status to failed:`, error);
      return;
    }
      
    console.log(`Updated track ${trackId} status to failed for format: ${format}`);
  } catch (error) {
    console.error(`Error updating track ${trackId} status to failed:`, error);
  }
}

/**
 * Update track with processed file URLs
 * @param supabase Supabase client
 * @param trackId Track ID
 * @param format Processing format
 * @param mp3Url MP3 URL if available
 * @param opusUrl Opus URL if available
 */
export async function updateTrackWithProcessedUrls(
  supabase: any,
  trackId: string,
  format: ProcessingFormat,
  mp3Url?: string,
  opusUrl?: string
): Promise<void> {
  try {
    const updateData: Record<string, any> = {};
    
    if ((format === 'all' || format === 'mp3') && mp3Url) {
      updateData.mp3_url = mp3Url;
      updateData.processing_status = 'completed';
      console.log(`MP3 processing completed for track: ${trackId}`);
    }
    
    if ((format === 'all' || format === 'opus') && opusUrl) {
      updateData.opus_url = opusUrl;
      updateData.opus_processing_status = 'completed';
      console.log(`Opus processing completed for track: ${trackId}`);
    }
    
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("tracks")
        .update(updateData)
        .eq("id", trackId);
        
      if (error) {
        console.error(`Error updating track ${trackId} with processed URLs:`, error);
        throw new Error(`Failed to update track with processed URLs: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error updating track ${trackId} with processed URLs:`, error);
    throw new Error(`Failed to update track with processed URLs: ${error.message}`);
  }
}
