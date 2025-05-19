
import { supabase } from "@/integrations/supabase/client";
import { Playlist, PlaylistCreateInput, PlaylistTrack, PlaylistUpdateInput, PlaylistWithTracks } from "@/types/playlist";

// Create a new playlist
export const createPlaylist = async (playlistData: PlaylistCreateInput): Promise<Playlist | null> => {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      name: playlistData.name,
      description: playlistData.description,
      is_public: playlistData.is_public
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }

  return data;
};

// Get all playlists for the current user
export const getUserPlaylists = async (): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting playlists:', error);
    throw error;
  }

  return data || [];
};

// Get a specific playlist with its tracks
export const getPlaylistWithTracks = async (playlistId: string): Promise<PlaylistWithTracks | null> => {
  // First get the playlist
  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', playlistId)
    .single();

  if (playlistError) {
    console.error('Error getting playlist:', playlistError);
    throw playlistError;
  }

  if (!playlist) return null;

  // Then get tracks for this playlist
  const { data: playlistTracks, error: tracksError } = await supabase
    .from('playlist_tracks')
    .select(`
      *,
      track:tracks(title, original_filename, version_number)
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (tracksError) {
    console.error('Error getting playlist tracks:', tracksError);
    throw tracksError;
  }

  return {
    ...playlist,
    tracks: playlistTracks || []
  };
};

// Update a playlist
export const updatePlaylist = async (playlistId: string, updates: PlaylistUpdateInput): Promise<void> => {
  const { error } = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', playlistId);

  if (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
};

// Delete a playlist
export const deletePlaylist = async (playlistId: string): Promise<void> => {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);

  if (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
};

// Add a track to a playlist
export const addTrackToPlaylist = async (
  playlistId: string, 
  trackId: string
): Promise<PlaylistTrack | null> => {
  // First get the highest position
  const { data: positionData, error: positionError } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);

  if (positionError) {
    console.error('Error getting highest position:', positionError);
    throw positionError;
  }

  const nextPosition = positionData && positionData.length > 0 
    ? positionData[0].position + 1
    : 0;

  // Add the track
  const { data, error } = await supabase
    .from('playlist_tracks')
    .insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: nextPosition
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error adding track to playlist:', error);
    throw error;
  }

  return data;
};

// Remove a track from a playlist
export const removeTrackFromPlaylist = async (
  playlistId: string, 
  trackId: string
): Promise<void> => {
  // First get the track to be removed
  const { data: trackData, error: trackError } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)
    .single();

  if (trackError) {
    console.error('Error getting track position:', trackError);
    throw trackError;
  }

  // Delete the track
  const { error: deleteError } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);

  if (deleteError) {
    console.error('Error removing track from playlist:', deleteError);
    throw deleteError;
  }

  // Update positions for tracks after the removed one
  const removedPosition = trackData.position;
  
  const { error: updateError } = await supabase
    .rpc('reorder_after_remove', {
      p_playlist_id: playlistId,
      p_removed_position: removedPosition
    });

  if (updateError) {
    console.error('Error updating positions:', updateError);
    throw updateError;
  }
};

// Move a track to a new position in a playlist
export const reorderPlaylistTrack = async (
  playlistId: string, 
  trackId: string, 
  newPosition: number
): Promise<void> => {
  // First get the current position
  const { data: trackData, error: trackError } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)
    .single();

  if (trackError) {
    console.error('Error getting track position:', trackError);
    throw trackError;
  }

  const oldPosition = trackData.position;
  
  // If the position didn't change, do nothing
  if (oldPosition === newPosition) return;

  // Make sure position is valid
  if (newPosition < 0) {
    throw new Error('Position cannot be negative');
  }

  // Update the position of other tracks
  if (oldPosition < newPosition) {
    // Moving down: decrease position of tracks between old and new
    const { error: updateError } = await supabase
      .rpc('reorder_move_down', {
        p_playlist_id: playlistId,
        p_old_position: oldPosition,
        p_new_position: newPosition
      });

    if (updateError) {
      console.error('Error updating positions:', updateError);
      throw updateError;
    }
  } else {
    // Moving up: increase position of tracks between new and old
    const { error: updateError } = await supabase
      .rpc('reorder_move_up', {
        p_playlist_id: playlistId,
        p_old_position: oldPosition,
        p_new_position: newPosition
      });

    if (updateError) {
      console.error('Error updating positions:', updateError);
      throw updateError;
    }
  }

  // Update the position of the moved track
  const { error: updateTrackError } = await supabase
    .from('playlist_tracks')
    .update({ position: newPosition })
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);

  if (updateTrackError) {
    console.error('Error updating track position:', updateTrackError);
    throw updateTrackError;
  }
};

// Get a playlist by share key (for future implementation)
export const getPlaylistByShareKey = async (shareKey: string): Promise<PlaylistWithTracks | null> => {
  // This is a placeholder for future share functionality
  // We'll implement this when we add playlist sharing
  return null;
};
