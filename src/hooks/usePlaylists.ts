
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Playlist, PlaylistCreateInput, PlaylistUpdateInput, PlaylistWithTracks } from '@/types/playlist';
import { 
  createPlaylist, 
  getUserPlaylists, 
  getPlaylistWithTracks, 
  updatePlaylist as updatePlaylistService, 
  deletePlaylist as deletePlaylistService,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTrack
} from '@/services/playlistService';
import { useToast } from '@/components/ui/use-toast';

export function usePlaylists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // Query playlists
  const { 
    data: playlists = [], 
    isLoading: isLoadingPlaylists,
    error: playlistsError,
    refetch: refetchPlaylists
  } = useQuery({
    queryKey: ['playlists'],
    queryFn: getUserPlaylists,
  });

  // Create playlist mutation
  const { mutateAsync: createPlaylistMutation } = useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast({
        title: "Playlist created",
        description: "Your playlist has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating playlist",
        description: "There was a problem creating your playlist.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  // Delete playlist mutation
  const { mutateAsync: deletePlaylistMutation } = useMutation({
    mutationFn: deletePlaylistService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast({
        title: "Playlist deleted",
        description: "Your playlist has been deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting playlist",
        description: "There was a problem deleting your playlist.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  // Update playlist mutation
  const { mutateAsync: updatePlaylistMutation } = useMutation({
    mutationFn: ({ playlistId, updates }: { playlistId: string, updates: PlaylistUpdateInput }) => 
      updatePlaylistService(playlistId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast({
        title: "Playlist updated",
        description: "Your playlist has been updated."
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating playlist",
        description: "There was a problem updating your playlist.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  // Add track to playlist mutation
  const { mutateAsync: addTrackMutation } = useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string, trackId: string }) =>
      addTrackToPlaylist(playlistId, trackId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] });
      toast({
        title: "Track added",
        description: "The track has been added to your playlist."
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding track",
        description: "There was a problem adding the track to your playlist.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  // Remove track from playlist mutation
  const { mutateAsync: removeTrackMutation } = useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string, trackId: string }) =>
      removeTrackFromPlaylist(playlistId, trackId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] });
      toast({
        title: "Track removed",
        description: "The track has been removed from your playlist."
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing track",
        description: "There was a problem removing the track from your playlist.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  // Reorder track mutation
  const { mutateAsync: reorderTrackMutation } = useMutation({
    mutationFn: ({ playlistId, trackId, newPosition }: { 
      playlistId: string, 
      trackId: string, 
      newPosition: number 
    }) => reorderPlaylistTrack(playlistId, trackId, newPosition),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] });
    },
    onError: (error) => {
      toast({
        title: "Error reordering tracks",
        description: "There was a problem reordering the tracks in your playlist.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  // Create a new playlist
  const handleCreatePlaylist = useCallback(async (data: PlaylistCreateInput) => {
    setIsCreatingPlaylist(true);
    try {
      const playlist = await createPlaylistMutation(data);
      setIsCreatingPlaylist(false);
      return playlist;
    } catch (error) {
      setIsCreatingPlaylist(false);
      throw error;
    }
  }, [createPlaylistMutation]);

  // Get a single playlist with tracks
  const getPlaylist = useCallback((playlistId: string) => {
    return useQuery({
      queryKey: ['playlist', playlistId],
      queryFn: () => getPlaylistWithTracks(playlistId),
    });
  }, []);

  return {
    playlists,
    isLoadingPlaylists,
    playlistsError,
    refetchPlaylists,
    isCreatingPlaylist,
    createPlaylist: handleCreatePlaylist,
    deletePlaylist: deletePlaylistMutation,
    updatePlaylist: updatePlaylistMutation,
    addTrackToPlaylist: addTrackMutation,
    removeTrackFromPlaylist: removeTrackMutation,
    reorderTrack: reorderTrackMutation,
    getPlaylist
  };
}
