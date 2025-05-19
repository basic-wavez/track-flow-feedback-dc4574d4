
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ListMusic, Download, Share2, Trash, ListPlus } from "lucide-react";
import AddToPlaylistDialog from "../playlist/AddToPlaylistDialog";

interface TrackActionsProps {
  trackId: string;
  isOwner: boolean;
  downloadUrl?: string;
  downloadEnabled?: boolean;
  onDelete?: () => void;
  onShare?: () => void;
  onCreateVersion?: () => void;
}

const TrackActions = ({
  trackId,
  isOwner,
  downloadUrl,
  downloadEnabled = false,
  onDelete,
  onShare,
  onCreateVersion,
}: TrackActionsProps) => {
  const canDownload = downloadEnabled && downloadUrl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] bg-wip-dark border-wip-gray">
        <AddToPlaylistDialog trackId={trackId}>
          <DropdownMenuItem className="cursor-pointer">
            <ListPlus className="mr-2 h-4 w-4" />
            Add to Playlist
          </DropdownMenuItem>
        </AddToPlaylistDialog>
        
        {onShare && (
          <DropdownMenuItem onClick={onShare} className="cursor-pointer">
            <Share2 className="mr-2 h-4 w-4" />
            Share Track
          </DropdownMenuItem>
        )}
        
        {canDownload && (
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </DropdownMenuItem>
        )}
        
        {isOwner && (
          <>
            <DropdownMenuSeparator />
            
            {onCreateVersion && (
              <DropdownMenuItem onClick={onCreateVersion} className="cursor-pointer">
                <ListMusic className="mr-2 h-4 w-4" />
                New Version
              </DropdownMenuItem>
            )}
            
            {onDelete && (
              <DropdownMenuItem 
                onClick={onDelete} 
                className="cursor-pointer text-red-500 focus:text-red-500"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Track
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TrackActions;
