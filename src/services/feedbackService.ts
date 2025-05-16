
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Feedback = Database['public']['Tables']['feedback']['Row'] & {
  guest_name?: string | null;
};

/**
 * Get all feedback for a specific track
 */
export const getFeedbackForTrack = async (trackId: string, versionNumber?: number): Promise<Feedback[]> => {
  let query = supabase
    .from('feedback')
    .select('*')
    .eq('track_id', trackId);
    
  // If a version number is provided, filter by that version
  if (versionNumber) {
    query = query.eq('version_number', versionNumber);
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
  
  return data || [];
};

/**
 * Check if a track has any feedback
 */
export const checkTrackHasFeedback = async (trackId: string): Promise<boolean> => {
  const { count, error } = await supabase
    .from('feedback')
    .select('id', { count: 'exact', head: true })
    .eq('track_id', trackId);
    
  if (error) {
    console.error('Error checking feedback:', error);
    return false;
  }
  
  return (count || 0) > 0;
};

/**
 * Submit feedback for a track
 * Now supports both authenticated and guest submissions
 * and includes version tracking
 */
export const submitFeedback = async (feedbackData: Omit<Feedback, 'id' | 'created_at'>): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .insert([feedbackData]);
    
  if (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }
  
  return true;
};

/**
 * Get feedback versions available for a track
 * Returns an array of unique version numbers
 */
export const getFeedbackVersions = async (trackId: string): Promise<number[]> => {
  const { data, error } = await supabase
    .from('feedback')
    .select('version_number')
    .eq('track_id', trackId)
    .order('version_number', { ascending: false });
    
  if (error) {
    console.error('Error fetching feedback versions:', error);
    return [];
  }
  
  // Extract unique version numbers
  const versions = new Set<number>();
  data?.forEach(item => {
    if (item.version_number) {
      versions.add(item.version_number);
    }
  });
  
  return Array.from(versions);
};
