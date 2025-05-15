
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, Share } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface TrackActionsProps {
  isOwner: boolean;
}

const TrackActions = ({ isOwner }: TrackActionsProps) => {
  const [downloadEnabled, setDownloadEnabled] = useState(false);

  const handleDownload = () => {
    // In a real app, this would initiate a download of the original file
    alert("Download functionality would be implemented here");
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

  return (
    <div className="mt-6 flex justify-between items-center">
      {isOwner && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Enable Downloads:</span>
          <Switch
            checked={downloadEnabled}
            onCheckedChange={setDownloadEnabled}
          />
        </div>
      )}
      
      <div className="flex gap-2 ml-auto">
        {downloadEnabled && (
          <Button 
            onClick={handleDownload} 
            variant="outline" 
            className="gap-2 border-wip-pink text-wip-pink hover:bg-wip-pink/10"
          >
            <Download className="h-4 w-4" />
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
