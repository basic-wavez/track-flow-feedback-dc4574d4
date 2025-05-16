
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateTrackDetails } from "@/services/trackUpdateService";
import { useToast } from "@/hooks/use-toast";

interface TrackSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  downloadsEnabled: boolean;
}

const TrackSettingsDialog = ({
  isOpen,
  onClose,
  trackId,
  downloadsEnabled: initialDownloadsEnabled,
}: TrackSettingsDialogProps) => {
  const [downloadsEnabled, setDownloadsEnabled] = useState<boolean>(initialDownloadsEnabled);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  const handleDownloadsToggle = async (checked: boolean) => {
    setIsSaving(true);
    setDownloadsEnabled(checked);
    
    try {
      const result = await updateTrackDetails(trackId, {
        downloads_enabled: checked
      });
      
      if (result) {
        toast({
          title: "Settings updated",
          description: checked ? "Downloads are now enabled" : "Downloads are now disabled",
        });
      }
    } catch (error) {
      console.error("Error updating download settings:", error);
      toast({
        title: "Error updating settings",
        description: "Could not update download settings. Please try again.",
        variant: "destructive",
      });
      // Revert the UI state if the server update fails
      setDownloadsEnabled(!checked);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track Settings</DialogTitle>
          <DialogDescription>
            Configure track sharing and download options
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="downloads-toggle" className="flex flex-col space-y-1">
              <span>Enable Downloads</span>
              <span className="font-normal text-xs text-muted-foreground">
                Allow listeners to download the original audio file
              </span>
            </Label>
            <Switch
              id="downloads-toggle"
              checked={downloadsEnabled}
              disabled={isSaving}
              onCheckedChange={handleDownloadsToggle}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrackSettingsDialog;
