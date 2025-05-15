
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, Share, Loader, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { updateTrackDetails } from "@/services/trackService";
import { retryOriginalFileUpload } from "@/services/trackRecoveryService";

interface TrackActionsProps {
  isOwner: boolean;
  originalUrl?: string;
  trackId?: string;
  originalFilename?: string; 
}

const TrackActions = ({ 
  isOwner, 
  originalUrl, 
  trackId,
  originalFilename = 'audio-file' // Default filename if none provided
}: TrackActionsProps) => {
  const [downloadEnabled, setDownloadEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Use fetch to get the file data first
      const response = await fetch(originalUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      
      // Convert the response to a blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Determine the filename, use provided one or extract from URL
      const filename = originalFilename || originalUrl.split('/').pop() || 'audio-file';
      
      // Create and trigger the download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // Revoke the blob URL to free memory
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast({
        title: "Download Started",
        description: "Your file is being downloaded",
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !trackId) {
      return;
    }

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      // Check if it's a valid audio file
      const validTypes = ['audio/wav', 'audio/flac', 'audio/aiff', 'audio/mpeg', 'audio/mp4'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an MP3, WAV, FLAC, AIFF, or AAC file.",
          variant: "destructive",
        });
        return;
      }

      const success = await retryOriginalFileUpload(trackId, file);
      
      if (success) {
        toast({
          title: "Upload Successful",
          description: "Original file has been uploaded successfully. Refresh the page to see the changes.",
        });
        
        // Refresh the page to show the updated track
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReuploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
            <div className="flex items-center">
              <span className="text-xs text-gray-500 ml-2">(Original file not available)</span>
              <Button 
                onClick={handleReuploadClick} 
                variant="ghost" 
                size="sm"
                className="flex gap-1 text-xs text-wip-pink hover:bg-wip-pink/10 ml-2"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                Reupload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
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
