
import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import TrackVersionItem from "@/components/track/TrackVersionItem";
import { TrackVersion } from "@/types/track";

interface TrackVersionsDrawerProps {
  trackId: string;
  trackTitle: string;
  versions: TrackVersion[];
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

const TrackVersionsDrawer: React.FC<TrackVersionsDrawerProps> = ({
  trackId,
  trackTitle,
  versions,
  children,
  isOpen,
  onClose
}) => {
  const [open, setOpen] = React.useState(false);
  
  // If external control props are provided, use them
  React.useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);
  
  // Handle internal state changes and notify parent if needed
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && onClose) {
      onClose();
    }
  };
  
  // If no versions to show, don't render anything
  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
      <DrawerContent className="bg-wip-dark border-t border-wip-gray">
        <DrawerHeader>
          <DrawerTitle className="text-center text-xl">
            Version History for {trackTitle}
          </DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          <div className="space-y-4">
            {versions.map((version) => (
              <TrackVersionItem
                key={version.id}
                version={version}
                trackId={trackId}
                isCurrent={version.is_latest_version}
              />
            ))}
          </div>
        </div>
        <div className="p-4 flex justify-center">
          <DrawerClose asChild>
            <button className="px-4 py-2 rounded-md bg-wip-darker border border-wip-gray hover:bg-wip-gray/20 transition-colors">
              Close
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default React.memo(TrackVersionsDrawer);
