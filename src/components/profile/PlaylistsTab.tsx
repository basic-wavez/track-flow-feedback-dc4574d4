
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus } from "lucide-react";
import { Playlist } from "@/types/playlist";
import PlaylistCard from "@/components/playlist/PlaylistCard";
import CreatePlaylistDialog from "@/components/playlist/CreatePlaylistDialog";

interface PlaylistsTabProps {
  playlists: Playlist[];
  isLoadingPlaylists: boolean;
  refetchPlaylists: () => void;
  openDeletePlaylistDialog: (playlistId: string) => void;
}

const PlaylistsTab = ({ 
  playlists, 
  isLoadingPlaylists, 
  refetchPlaylists,
  openDeletePlaylistDialog 
}: PlaylistsTabProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-wip-darker border-wip-gray">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Playlists</CardTitle>
          <CardDescription>
            Organize your tracks into playlists
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPlaylists()}
            disabled={isLoadingPlaylists}
          >
            <Clock className={`h-4 w-4 mr-1 ${isLoadingPlaylists ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingPlaylists ? (
          <div className="py-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading your playlists...</p>
          </div>
        ) : playlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onDelete={openDeletePlaylistDialog}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-wip-gray rounded-lg bg-wip-dark">
            <h3 className="text-xl font-medium mb-2">No Playlists Yet</h3>
            <p className="text-gray-400 mb-6">Create your first playlist to organize your tracks.</p>
            <CreatePlaylistDialog onPlaylistCreated={(id) => navigate(`/playlist/${id}`)}>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Playlist
              </Button>
            </CreatePlaylistDialog>
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <CreatePlaylistDialog onPlaylistCreated={(id) => navigate(`/playlist/${id}`)}>
            <Button size="lg" className="px-8">
              <Plus className="h-4 w-4 mr-1" />
              Create New Playlist
            </Button>
          </CreatePlaylistDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaylistsTab;
