
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { updateTrackDetails } from "@/services/trackUpdateService";
import { useToast } from "@/components/ui/use-toast";

interface TrackHeaderProps {
  trackId: string;
  trackName: string;
  playbackState: string;
  isLoading: boolean;
  usingMp3: boolean;
  processingStatus: string;
  showProcessButton: boolean;
  isRequestingProcessing: boolean;
  onRequestProcessing: () => Promise<void>;
  isOwner?: boolean;
  versionNumber?: number;
}

const TrackHeader = ({
  trackId,
  trackName,
  playbackState,
  isLoading,
  usingMp3,
  processingStatus,
  showProcessButton,
  isRequestingProcessing,
  onRequestProcessing,
  isOwner = false,
  versionNumber = 1
}: TrackHeaderProps) => {
  const [statusMode, setStatusMode] = useState<"wip" | "demo">("wip");
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(trackName);
  const { toast } = useToast();

  // Helper function to render playback status indicator - never show loading
  const renderPlaybackStatus = () => {
    if (playbackState === 'error') {
      return <span className="text-red-500">Error loading audio</span>;
    }
    return null;
  };

  const toggleStatus = () => {
    if (!isOwner) return;
    setStatusMode(statusMode === "wip" ? "demo" : "wip");
  };

  const handleOpenRenameDialog = () => {
    setNewName(trackName);
    setIsRenaming(true);
  };

  const handleRename = async () => {
    if (newName.trim() === '') {
      toast({
        title: "Error",
        description: "Track name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      const success = await updateTrackDetails(trackId, {
        title: newName
      });

      if (success) {
        toast({
          title: "Track renamed",
          description: "Your track has been renamed successfully"
        });
        setIsRenaming(false);
        // Force reload the page to reflect the change
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename track",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold gradient-text">{trackName}</h2>
          {isOwner && (
            <Button 
              size="icon"
              variant="ghost" 
              className="h-6 w-6 rounded-full hover:bg-wip-gray/20"
              onClick={handleOpenRenameDialog}
              title="Rename track"
            >
              <Pencil className="h-4 w-4 text-wip-pink" />
            </Button>
          )}
          {/* Version number badge */}
          {versionNumber && (
            <Badge variant="outline" className="ml-1 bg-wip-darker text-wip-pink border-wip-pink">
              v{versionNumber}
            </Badge>
          )}
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-400 text-sm">
              {renderPlaybackStatus()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`border-wip-pink text-wip-pink ${isOwner ? 'cursor-pointer hover:bg-wip-pink/10 transition-colors' : 'opacity-75'}`}
            onClick={toggleStatus}
            title={isOwner ? `Change status to ${statusMode === "wip" ? "Demo" : "Work In Progress"}` : "Only the owner can change this status"}
          >
            {statusMode === "wip" ? "Work In Progress" : "Demo"}
          </Badge>
        </div>
      </div>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent className="bg-wip-darker border-wip-gray max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Track</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new track name"
              className="bg-wip-dark border-wip-gray"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsRenaming(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrackHeader;
