
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, Share, Loader } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { updateTrackDetails } from "@/services/trackService";

interface TrackActionsProps {
  isOwner: boolean;
  originalUrl?: string;
  trackId?: string;
}

const TrackActions = ({ isOwner, originalUrl, trackId }: TrackActionsProps) => {
  const [downloadEnabled, setDownloadEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadToggle = async (enabled: boolean) => {
    if (!trackId || !isOwner) return;
    
    setIsUpdating(true);
    try {
      await updateTrackDetails(trackId, { downloads_enabled: enabled });
      setDownloadEnabled(enabled);
      
      toast({
        title: enabled ? "Downloads Enabled" : "Downloads Disabled",
        description: enabled 
          ? "Users can now download the original file" 
          : "Users can no longer download the original file",
      });
    } catch (error) {
      console.error("Error updating download settings:", error);
      toast({
        title: "Update Failed",
        description: "Could not update download settings",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownload = async () => {
    if (!originalUrl) {
      toast({
        title: "Download Failed",
        description: "Original file is not available for download",
        variant: "destructive",
      });
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Start the download by creating a temporary anchor and triggering a click
      const link = document.createElement('a');
      link.href = originalUrl;
      link.setAttribute('download', ''); // This will use the server's suggested filename
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your download should begin shortly",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the file",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    // In a real app, this would generate a shareable link
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Track link copied to clipboard!",
        });
      })
      .catch(err => {
        console.error("Could not copy link:", err);
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard.",
          variant: "destructive",
        });
      });
  };

  // Check if the track has an original file available for download
  const hasOriginalFile = Boolean(originalUrl);

  return (
    <div className="mt-6 flex justify-between items-center">
      {isOwner && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Enable Downloads:</span>
          <Switch
            checked={downloadEnabled}
            onCheckedChange={handleDownloadToggle}
            disabled={isUpdating || !hasOriginalFile}
          />
          {isUpdating && <Loader className="h-4 w-4 animate-spin ml-2" />}
          {!hasOriginalFile && isOwner && (
            <span className="text-xs text-gray-500 ml-2">(Original file not available)</span>
          )}
        </div>
      )}
      
      <div className="flex gap-2 ml-auto">
        {downloadEnabled && hasOriginalFile && (
          <Button 
            onClick={handleDownload} 
            variant="outline" 
            className="gap-2 border-wip-pink text-wip-pink hover:bg-wip-pink/10"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Original
          </Button>
        )}
        
        <Button 
          onClick={handleShare} 
          className="gap-2 gradient-bg hover:opacity-90"
        >
          <Share className="h-4 w-4" />
          Share for Feedback
        </Button>
      </div>
    </div>
  );
};

export default TrackActions;
