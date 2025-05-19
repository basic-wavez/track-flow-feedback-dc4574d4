
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Plus, Share2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createPlaylistShareLink, getPlaylistShareLinks, deletePlaylistShareLink } from "@/services/playlistShareService";
import { formatDistanceToNow } from "date-fns";

interface PlaylistShareLink {
  id: string;
  name: string;
  share_key: string;
  created_at: string;
  play_count: number;
  download_count: number;
  last_played_at: string | null;
}

interface PlaylistShareDialogProps {
  playlistId: string;
  playlistName: string;
  children: React.ReactNode;
}

const PlaylistShareDialog = ({ playlistId, playlistName, children }: PlaylistShareDialogProps) => {
  const [shareLinks, setShareLinks] = useState<PlaylistShareLink[]>([]);
  const [newLinkName, setNewLinkName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Fetch share links when dialog opens
  useEffect(() => {
    if (open) {
      loadShareLinks();
    }
  }, [open]);

  const loadShareLinks = async () => {
    try {
      setIsLoading(true);
      const links = await getPlaylistShareLinks(playlistId);
      setShareLinks(links);
    } catch (error) {
      toast({
        title: "Error loading share links",
        description: "There was a problem loading your share links.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!newLinkName.trim()) {
      toast({
        title: "Name is required",
        description: "Please provide a name for the share link.",
        variant: "destructive"
      });
      return;
    }

    if (shareLinks.length >= 10) {
      toast({
        title: "Maximum links reached",
        description: "You can only create up to 10 share links per playlist.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      const newLink = await createPlaylistShareLink(playlistId, newLinkName);
      setShareLinks([newLink, ...shareLinks]);
      setNewLinkName("");
      toast({
        title: "Share link created",
        description: "Your share link has been created successfully."
      });
    } catch (error) {
      toast({
        title: "Error creating share link",
        description: "There was a problem creating your share link.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deletePlaylistShareLink(linkId);
      setShareLinks(shareLinks.filter(link => link.id !== linkId));
      toast({
        title: "Share link deleted",
        description: "Your share link has been deleted."
      });
    } catch (error) {
      toast({
        title: "Error deleting share link",
        description: "There was a problem deleting your share link.",
        variant: "destructive"
      });
    }
  };

  const copyShareLink = (shareKey: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/playlist/${shareKey}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast({
          title: "Link copied",
          description: "Share link copied to clipboard."
        });
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy link to clipboard.",
          variant: "destructive"
        });
      });
  };

  const getShareUrl = (shareKey: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/playlist/${shareKey}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Playlist</DialogTitle>
          <DialogDescription>
            Create and manage share links for "{playlistName}". You can create up to 10 share links.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex items-end space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link-name">New Share Link Name</Label>
              <Input
                id="link-name"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                placeholder="e.g., For DJ friends"
                disabled={isCreating || shareLinks.length >= 10}
              />
            </div>
            <Button 
              onClick={handleCreateLink} 
              disabled={isCreating || !newLinkName.trim() || shareLinks.length >= 10}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>

          {shareLinks.length > 0 ? (
            <div className="border border-wip-gray rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Plays</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shareLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.name}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}</TableCell>
                      <TableCell>{link.play_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyShareLink(link.share_key)}
                            title="Copy share link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-100/20"
                            onClick={() => handleDeleteLink(link.id)}
                            title="Delete share link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-wip-gray rounded-md">
              {isLoading ? (
                <p>Loading share links...</p>
              ) : (
                <>
                  <Share2 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-400">No share links yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a link to share this playlist with others
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaylistShareDialog;
