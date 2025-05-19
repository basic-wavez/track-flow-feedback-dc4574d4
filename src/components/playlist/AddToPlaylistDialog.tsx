
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import CreatePlaylistDialog from "./CreatePlaylistDialog";

interface AddToPlaylistDialogProps {
  children: React.ReactNode;
  trackId: string;
}

const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
  children,
  trackId,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playlists, isLoadingPlaylists, addTrackToPlaylist } = usePlaylists();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const handleAddToPlaylist = async (playlistId: string) => {
    setIsAdding(playlistId);
    try {
      await addTrackToPlaylist({ playlistId, trackId });
      toast({
        title: "Track added to playlist",
        description: "The track was successfully added to your playlist.",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Failed to add track",
        description: "There was an error adding the track to your playlist.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsAdding(null);
    }
  };

  const onPlaylistCreated = async (playlistId: string) => {
    // After creating a playlist, add the track to it
    await handleAddToPlaylist(playlistId);
    // Navigate to the playlist view
    navigate(`/playlist/${playlistId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-wip-dark border-wip-gray">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
          <DialogDescription>
            Choose a playlist to add this track to or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <CreatePlaylistDialog onPlaylistCreated={onPlaylistCreated}>
            <Button
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Create New Playlist
            </Button>
          </CreatePlaylistDialog>
        </div>

        <Separator className="my-2" />

        <div className="max-h-[300px] overflow-y-auto pr-1">
          {isLoadingPlaylists ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-wip-pink" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              You don't have any playlists yet.
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <Button
                  key={playlist.id}
                  variant="ghost"
                  className="w-full justify-start hover:bg-wip-gray/10 text-left"
                  disabled={isAdding === playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                >
                  <div className="truncate">
                    {isAdding === playlist.id ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </div>
                    ) : (
                      playlist.name
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlaylistDialog;
