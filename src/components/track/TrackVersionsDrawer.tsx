
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TrackVersion } from "@/types/track";
import { Button } from "../ui/button";
import { ArrowUpCircle, History } from "lucide-react";
import TrackVersionItem from "./TrackVersionItem";
import { useNavigate } from "react-router-dom";
import { Dispatch, SetStateAction } from "react";

interface TrackVersionsDrawerProps {
  trackId: string;
  trackTitle: string;
  versions: TrackVersion[];
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
}

const TrackVersionsDrawer = ({
  trackId,
  trackTitle,
  versions,
  children,
  isOpen,
  onOpenChange,
}: TrackVersionsDrawerProps) => {
  const navigate = useNavigate();
  // Always sort versions by version number (highest first)
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);
  // Log versions for debugging
  console.log("TrackVersionsDrawer - Received versions:", versions.map(v => ({ id: v.id, version: v.version_number })));
  console.log("TrackVersionsDrawer - Sorted versions:", sortedVersions.map(v => ({ id: v.id, version: v.version_number })));
  
  const latestVersion = sortedVersions.find(v => v.is_latest_version) || sortedVersions[0];
  
  const handleCreateNewVersion = () => {
    navigate(`/track/${trackId}/version`);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="bg-wip-darker border-t border-wip-gray">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-xl">{trackTitle}</DrawerTitle>
            <DrawerDescription>
              {versions.length} version{versions.length !== 1 ? 's' : ''}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4">
            <div className="mb-4">
              <Button 
                className="w-full flex items-center gap-2"
                onClick={handleCreateNewVersion}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Create New Version
              </Button>
            </div>
            
            <div className="bg-wip-dark rounded-lg border border-wip-gray p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-300">
                <History className="h-4 w-4" />
                Version History
              </h3>
              
              <div className="space-y-1">
                {sortedVersions.map(version => (
                  <TrackVersionItem
                    key={version.id}
                    version={version}
                    isLatest={version.id === latestVersion.id}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-2 p-4 pt-0">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Close</Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TrackVersionsDrawer;
