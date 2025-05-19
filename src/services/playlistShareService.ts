
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
    throw new Error(`Failed to create share link: ${error.message}`);
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
    throw new Error(`Failed to get share links: ${error.message}`);
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
    throw new Error(`Failed to delete share link: ${error.message}`);
  }
};

// Get playlist by share key for public access
export const getPlaylistByShareKey = async (shareKey: string): Promise<any> => {
  console.log("Fetching playlist with shareKey:", shareKey);
  
  if (!shareKey) {
    console.error("No share key provided");
    throw new Error("No share key provided");
  }
  
  // First, get the share link data
  const { data: shareData, error: shareError } = await supabase
    .from('playlist_share_links')
    .select('playlist_id, id, play_count')
    .eq('share_key', shareKey)
    .single();

  if (shareError) {
    console.error('Error getting share link:', shareError);
    // Specifically check for 'not found' errors
    if (shareError.code === 'PGRST116') {
      throw new Error(`Share link not found. It may have been deleted.`);
    }
    throw new Error(`Failed to get share link: ${shareError.message}`);
  }

  if (!shareData) {
    console.error("No share data found for key:", shareKey);
    throw new Error("Invalid share link");
  }

  console.log("Share link found for playlist:", shareData.playlist_id);

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
    throw new Error(`Failed to get playlist: ${playlistError.message}`);
  }

  if (!playlist) {
    console.error("Playlist not found for ID:", shareData.playlist_id);
    throw new Error("Playlist not found. It may have been deleted.");
  }

  console.log("Retrieved playlist with:", playlist.tracks.length, "tracks");

  // Update play count
  try {
    await supabase
      .from('playlist_share_links')
      .update({
        play_count: (shareData.play_count || 0) + 1,
        last_played_at: new Date().toISOString()
      })
      .eq('id', shareData.id);
    
    console.log("Updated play count for share link:", shareData.id);
  } catch (updateError) {
    // Non-critical error, just log it
    console.error('Error updating play count:', updateError);
  }

  return playlist;
};
