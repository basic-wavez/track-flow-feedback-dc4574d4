
import { useState, useEffect } from "react";
import { Share2, Copy, Trash2, Plus, ExternalLink, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { createShareLink, getShareLinks, deleteShareLink } from "@/services/trackShareService";

interface ShareLink {
  id: string;
  name: string;
  share_key: string;
  created_at: string;
  play_count: number;
  last_played_at: string | null;
}

interface ShareLinkManagerProps {
  trackId: string;
  trackTitle: string;
}

const MAX_LINKS = 10;

const ShareLinkManager = ({ trackId, trackTitle }: ShareLinkManagerProps) => {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLinkName, setNewLinkName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<ShareLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Auto-refresh interval (every 30 seconds)
  const AUTO_REFRESH_INTERVAL = 30000;

  const loadShareLinks = async () => {
    setIsLoading(true);
    try {
      const links = await getShareLinks(trackId);
      setShareLinks(links);
    } catch (error) {
      console.error("Error loading share links:", error);
      toast({
        title: "Error",
        description: "Failed to load share links",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadShareLinks();
      toast({
        title: "Refreshed",
        description: "Share link data has been updated",
      });
    } catch (error) {
      console.error("Error refreshing share links:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (trackId) {
      loadShareLinks();
    }
    
    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      if (trackId) {
        loadShareLinks();
      }
    }, AUTO_REFRESH_INTERVAL);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [trackId]);

  const handleCreateLink = async () => {
    if (!newLinkName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the share link",
        variant: "destructive",
      });
      return;
    }

    try {
      const newLink = await createShareLink(trackId, newLinkName.trim());
      if (newLink) {
        setShareLinks(prev => [newLink, ...prev]);
        setNewLinkName("");
        setIsCreateDialogOpen(false);
        toast({
          title: "Success",
          description: "Share link created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating share link:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create share link",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteShareLink(linkToDelete.id);
      if (success) {
        setShareLinks(prev => prev.filter(link => link.id !== linkToDelete.id));
        toast({
          title: "Success",
          description: "Share link deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete share link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting share link:", error);
      toast({
        title: "Error",
        description: "Failed to delete share link",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setLinkToDelete(null);
    }
  };

  const copyShareLink = (shareKey: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/track/share/${shareKey}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Share link copied to clipboard",
        });
      })
      .catch(err => {
        console.error("Could not copy link:", err);
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      });
  };

  const openLink = (shareKey: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/track/share/${shareKey}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Share Links for "{trackTitle}"</h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)} 
            disabled={shareLinks.length >= MAX_LINKS}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Share Link
          </Button>
        </div>
      </div>
      
      <div className="mb-2">
        <Badge variant="outline" className="text-sm">
          {shareLinks.length} of {MAX_LINKS} links used
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-wip-pink border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading share links...</p>
        </div>
      ) : shareLinks.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Link Name</TableHead>
              <TableHead>Play Count</TableHead>
              <TableHead>Last Played</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shareLinks.map(link => (
              <TableRow key={link.id}>
                <TableCell className="font-medium">{link.name}</TableCell>
                <TableCell>
                  <Badge variant={link.play_count > 0 ? "warning" : "outline"}>
                    {link.play_count} {link.play_count === 1 ? 'play' : 'plays'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {link.last_played_at ? (
                    formatDistanceToNow(new Date(link.last_played_at), { addSuffix: true })
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyShareLink(link.share_key)}
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openLink(link.share_key)}
                      title="Open link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setLinkToDelete(link)}
                      title="Delete link"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-md">
          <Share2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No share links created yet</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Your First Share Link
          </Button>
        </div>
      )}

      {/* Create Link Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Share Link</DialogTitle>
            <DialogDescription>
              Create a unique sharing link for "{trackTitle}". You can use this to track how many times your track has been played through this specific link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="linkName">Link Name</Label>
              <Input
                id="linkName"
                placeholder="e.g., Sent to John, Music Blog, etc."
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Enter a name to help you remember who you sent this link to.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLink}>
              Create Share Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!linkToDelete} onOpenChange={(open) => !open && setLinkToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Share Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the share link "{linkToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Prevent dialog from closing automatically
                handleDeleteLink();
              }}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShareLinkManager;
