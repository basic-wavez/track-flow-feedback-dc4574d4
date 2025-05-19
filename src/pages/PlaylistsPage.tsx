
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { usePlaylists } from "@/hooks/usePlaylists";
import CreatePlaylistDialog from "@/components/playlist/CreatePlaylistDialog";
import PlaylistCard from "@/components/playlist/PlaylistCard";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const PlaylistsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playlists, isLoadingPlaylists, deletePlaylist, refetchPlaylists } = usePlaylists();
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleDeletePlaylist = async () => {
    if (playlistToDelete) {
      await deletePlaylist(playlistToDelete);
      setPlaylistToDelete(null);
    }
  };

  const openDeleteDialog = (playlistId: string) => {
    setPlaylistToDelete(playlistId);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Playlists</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPlaylists()}
            disabled={isLoadingPlaylists}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingPlaylists ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <CreatePlaylistDialog onPlaylistCreated={(id) => navigate(`/playlist/${id}`)}>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              New Playlist
            </Button>
          </CreatePlaylistDialog>
        </div>
      </div>

      {isLoadingPlaylists ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse">Loading playlists...</div>
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-wip-gray rounded-lg bg-wip-darker">
          <h3 className="text-xl font-medium mb-2">No Playlists Yet</h3>
          <p className="text-gray-400 mb-6">Create your first playlist to organize your tracks.</p>
          <CreatePlaylistDialog onPlaylistCreated={(id) => navigate(`/playlist/${id}`)}>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create Your First Playlist
            </Button>
          </CreatePlaylistDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!playlistToDelete} onOpenChange={() => setPlaylistToDelete(null)}>
        <AlertDialogTrigger className="hidden" />
        <AlertDialogContent className="bg-wip-dark border-wip-gray">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this playlist. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeletePlaylist}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlaylistsPage;
