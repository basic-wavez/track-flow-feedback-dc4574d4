import { supabase } from "@/integrations/supabase/client";
import { PlaylistWithTracks, PlaylistTrack } from "@/types/playlist";

export async function getPlaylistByShareKey(shareKey: string): Promise<PlaylistWithTracks | null> {
  try {
    // Get the share link first to find the playlist_id
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('playlist_share_links')
      .select('playlist_id, name, play_count')
      .eq('share_key', shareKey)
      .single();

    if (shareLinkError || !shareLink) {
      console.error('Error fetching share link:', shareLinkError);
      return null;
    }

    // Now get the playlist with tracks
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select(`
        id,
        name,
        description,
        created_at,
        updated_at,
        user_id,
        is_public,
        playlist_tracks (
          id,
          position,
          track_id,
          created_at,
          tracks: track_id (
            id,
            title,
            original_filename,
            mp3_url,
            compressed_url,
            version_number
          )
        )
      `)
      .eq('id', shareLink.playlist_id)
      .single();

    if (playlistError || !playlist) {
      console.error('Error fetching playlist:', playlistError);
      return null;
    }

    // Transform the result into the expected format - now ensuring all required fields are included
    const tracks: PlaylistTrack[] = playlist.playlist_tracks.map(pt => ({
      id: pt.id,
      position: pt.position,
      track_id: pt.track_id,
      created_at: pt.created_at,
      playlist_id: playlist.id,
      track: {
        title: pt.tracks.title,
        original_filename: pt.tracks.original_filename,
        version_number: pt.tracks.version_number, 
        mp3_url: pt.tracks.mp3_url,
        compressed_url: pt.tracks.compressed_url
      }
    }));

    // Sort tracks by position
    tracks.sort((a, b) => a.position - b.position);

    return {
      ...playlist,
      tracks
    };
  } catch (error) {
    console.error('Error in getPlaylistByShareKey:', error);
    return null;
  }
}

export async function getPlaylistShareLinks(playlistId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('playlist_share_links')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching share links:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPlaylistShareLinks:', error);
    return [];
  }
}

export async function createPlaylistShareLink(playlistId: string, name: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('playlist_share_links')
      .insert([
        { 
          playlist_id: playlistId, 
          name,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating share link:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createPlaylistShareLink:', error);
    throw error;
  }
}

export async function deletePlaylistShareLink(linkId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('playlist_share_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      console.error('Error deleting share link:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deletePlaylistShareLink:', error);
    throw error;
  }
}
