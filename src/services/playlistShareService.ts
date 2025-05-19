
import { supabase } from "@/integrations/supabase/client";

// Create a share link for a playlist
export const createPlaylistShareLink = async (playlistId: string, name: string): Promise<any> => {
  // Get the current user ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create a playlist share link');
  }

  const { data, error } = await supabase
    .from('playlist_share_links')
    .insert({
      playlist_id: playlistId,
      name: name,
      user_id: user.id
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating playlist share link:', error);
    throw error;
  }

  return data;
};

// Get all share links for a specific playlist
export const getPlaylistShareLinks = async (playlistId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('playlist_share_links')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting playlist share links:', error);
    throw error;
  }

  return data || [];
};

// Delete a share link
export const deletePlaylistShareLink = async (linkId: string): Promise<void> => {
  const { error } = await supabase
    .from('playlist_share_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error('Error deleting playlist share link:', error);
    throw error;
  }
};

// Get playlist by share key for public access
export const getPlaylistByShareKey = async (shareKey: string): Promise<any> => {
  // First, get the share link data
  const { data: shareData, error: shareError } = await supabase
    .from('playlist_share_links')
    .select('playlist_id, id, play_count')
    .eq('share_key', shareKey)
    .single();

  if (shareError) {
    console.error('Error getting share link:', shareError);
    throw shareError;
  }

  if (!shareData) return null;

  // Then get the playlist with its tracks
  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select(`
      *,
      tracks:playlist_tracks(
        *,
        track:tracks(title, original_filename, version_number, mp3_url, opus_url, original_url, compressed_url)
      )
    `)
    .eq('id', shareData.playlist_id)
    .single();

  if (playlistError) {
    console.error('Error getting shared playlist:', playlistError);
    throw playlistError;
  }

  // Update play count
  await supabase
    .from('playlist_share_links')
    .update({
      play_count: (shareData.play_count || 0) + 1,
      last_played_at: new Date().toISOString()
    })
    .eq('id', shareData.id);

  return playlist;
};
