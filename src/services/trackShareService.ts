
import { supabase } from "@/integrations/supabase/client";

interface ShareLink {
  id: string;
  track_id: string;
  name: string;
  share_key: string;
  created_at: string;
  play_count: number;
  last_played_at: string | null;
}

/**
 * Creates a new share link for a track
 * @param trackId The ID of the track
 * @param name A descriptive name for the link
 * @returns The created share link or null if creation failed
 */
export const createShareLink = async (trackId: string, name: string): Promise<ShareLink | null> => {
  try {
    const { data: existingLinks, error: countError } = await supabase
      .from('share_links')
      .select('id')
      .eq('track_id', trackId);
    
    if (countError) {
      console.error('Error checking existing links:', countError);
      return null;
    }
    
    // Check if the user has reached the maximum number of allowed links (10)
    if (existingLinks && existingLinks.length >= 10) {
      throw new Error('You have reached the maximum number of 10 share links for this track.');
    }
    
    // Get the current user's ID from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('share_links')
      .insert({
        track_id: trackId,
        name: name,
        user_id: user.id
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating share link:', error);
      return null;
    }
    
    return data as ShareLink;
  } catch (error) {
    console.error('Error in createShareLink:', error);
    throw error;
  }
};

/**
 * Gets all share links for a track
 * @param trackId The ID of the track
 * @returns An array of share links
 */
export const getShareLinks = async (trackId: string): Promise<ShareLink[]> => {
  try {
    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching share links:', error);
      return [];
    }
    
    return data as ShareLink[];
  } catch (error) {
    console.error('Error in getShareLinks:', error);
    return [];
  }
};

/**
 * Gets a track ID by share key
 * @param shareKey The unique share key
 * @returns The track ID or null if not found
 */
export const getTrackIdByShareKey = async (shareKey: string): Promise<string | null> => {
  try {
    console.log('Looking up track ID by share key:', shareKey);
    
    const { data, error } = await supabase
      .from('share_links')
      .select('track_id')
      .eq('share_key', shareKey)
      .single();
    
    if (error || !data) {
      console.error('Error fetching track by share key:', error);
      return null;
    }
    
    console.log('Found track ID:', data.track_id);
    return data.track_id;
  } catch (error) {
    console.error('Error in getTrackIdByShareKey:', error);
    return null;
  }
};

// Server-side cooldown period in milliseconds (10 minutes)
const SERVER_COOLDOWN_PERIOD_MS = 600000;

/**
 * Checks if a share link is in cooldown period based on the server timestamp
 * @param shareKey The unique share key
 * @returns Whether the share link is in cooldown period
 */
export const isInServerCooldown = async (shareKey: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('share_links')
      .select('last_played_at')
      .eq('share_key', shareKey)
      .single();
    
    if (error || !data) {
      console.error('Error checking cooldown period:', error);
      return false;
    }
    
    if (!data.last_played_at) {
      return false; // Never played before
    }
    
    const lastPlayedTime = new Date(data.last_played_at).getTime();
    const currentTime = Date.now();
    const timeSinceLastPlay = currentTime - lastPlayedTime;
    
    console.log('Time since last play:', timeSinceLastPlay, 'ms, Cooldown period:', SERVER_COOLDOWN_PERIOD_MS, 'ms');
    return timeSinceLastPlay < SERVER_COOLDOWN_PERIOD_MS;
  } catch (error) {
    console.error('Error in isInServerCooldown:', error);
    return false;
  }
};

/**
 * Increments the play count for a share link
 * @param shareKey The unique share key
 * @returns Whether the operation was successful
 */
export const incrementPlayCount = async (shareKey: string): Promise<boolean> => {
  try {
    console.log('Incrementing play count for share key:', shareKey);
    
    // Check if we're in server cooldown period first
    const inCooldown = await isInServerCooldown(shareKey);
    if (inCooldown) {
      console.log('Share link is in server cooldown period, not incrementing count');
      return false;
    }
    
    const { data: link, error: fetchError } = await supabase
      .from('share_links')
      .select('id, play_count')
      .eq('share_key', shareKey)
      .single();
    
    if (fetchError || !link) {
      console.error('Error fetching share link:', fetchError);
      return false;
    }
    
    const { error: updateError } = await supabase
      .from('share_links')
      .update({
        play_count: link.play_count + 1,
        last_played_at: new Date().toISOString()
      })
      .eq('id', link.id);
    
    if (updateError) {
      console.error('Error updating play count:', updateError);
      return false;
    }
    
    console.log('Successfully incremented play count to', link.play_count + 1);
    return true;
  } catch (error) {
    console.error('Error in incrementPlayCount:', error);
    return false;
  }
};

/**
 * Deletes a share link
 * @param linkId The ID of the share link to delete
 * @returns Whether the operation was successful
 */
export const deleteShareLink = async (linkId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('id', linkId);
    
    if (error) {
      console.error('Error deleting share link:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteShareLink:', error);
    return false;
  }
};
