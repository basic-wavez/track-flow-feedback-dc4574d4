
import { useState } from "react";
import { Download, Share2, MoreHorizontal, Settings, ArrowUpCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { incrementDownloadCount } from "@/services/trackShareService";
import TrackSettingsDialog from "@/components/track/TrackSettingsDialog";
import TrackVersionsDrawer from "@/components/track/TrackVersionsDrawer";
import { useNavigate } from "react-router-dom";
import { TrackVersion } from "@/types/track";

interface TrackActionsProps {
  isOwner: boolean;
  originalUrl?: string;
  originalFilename?: string;
  trackId: string;
  downloadsEnabled?: boolean;
  shareKey?: string;
  versionNumber?: number;
  trackVersions?: TrackVersion[];
}

const TrackActions = ({ 
  isOwner, 
  originalUrl, 
  originalFilename,
  trackId,
  downloadsEnabled = false,
  shareKey,
  versionNumber = 1,
  trackVersions = []
}: TrackActionsProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionsDrawerOpen, setIsVersionsDrawerOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // If we have a share key, increment the download count
      if (shareKey) {
        try {
          await incrementDownloadCount(shareKey);
          console.log("Download count incremented for share key:", shareKey);
        } catch (error) {
          console.error("Error incrementing download count:", error);
          // Continue with download even if count increment fails
        }
      }
      
      if (!originalUrl) {
        throw new Error("No download URL available");
      }
      
      // Fetch the file as a blob
      const response = await fetch(originalUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      // Convert the response to a blob
      const fileBlob = await response.blob();
      
      // Create a local URL for the blob
      const blobUrl = URL.createObjectURL(fileBlob);
      
      // Create a temporary anchor element to trigger the download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = originalFilename || "track.wav";
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // Important: Revoke the blob URL to free up memory
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast({
        title: "Download Started",
        description: "Your file is being downloaded.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Could not download the file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleShare = () => {
    // Copy the current URL to clipboard
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Track link copied to clipboard",
        });
      })
      .catch(err => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard",
          variant: "destructive"
        });
      });
  };
  
  const showDownloadButton = isOwner || downloadsEnabled;
  
  return (
    <div className="flex justify-end mt-4 space-x-2">
      {showDownloadButton && originalUrl && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading || !originalUrl}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download Original"}
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      
      {isOwner && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Track Settings
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate(`/track/${trackId}/version`)}>
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                New Version
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setIsVersionsDrawerOpen(true)}>
                <History className="h-4 w-4 mr-2" />
                Version History
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => window.location.href = `/track/${trackId}/delete`} className="text-destructive">
                Delete Track
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <TrackSettingsDialog 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            trackId={trackId}
            downloadsEnabled={downloadsEnabled}
          />
          
          {trackVersions.length > 0 && (
            <TrackVersionsDrawer
              trackId={trackId}
              trackTitle={""}
              versions={trackVersions}
              isOpen={isVersionsDrawerOpen}
              onOpenChange={setIsVersionsDrawerOpen}
            >
              {/* No children needed since we're controlling the drawer via state */}
            </TrackVersionsDrawer>
          )}
        </>
      )}
    </div>
  );
};

export default TrackActions;
