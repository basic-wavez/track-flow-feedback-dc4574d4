
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Feedback = Database['public']['Tables']['feedback']['Row'] & {
  guest_name?: string | null;
};

/**
 * Get all feedback for a specific track
 */
export const getFeedbackForTrack = async (trackId: string): Promise<Feedback[]> => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('track_id', trackId);
    
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
