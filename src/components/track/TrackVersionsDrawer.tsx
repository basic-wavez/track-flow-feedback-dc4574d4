
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
import { Dispatch, SetStateAction, useMemo, memo } from "react";

interface TrackVersionsDrawerProps {
  trackId: string;
  trackTitle: string;
  versions: TrackVersion[];
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
}

// Use memo to prevent unnecessary re-renders
const TrackVersionsDrawer = memo(({
  trackId,
  trackTitle,
  versions,
  children,
  isOpen,
  onOpenChange,
}: TrackVersionsDrawerProps) => {
  const navigate = useNavigate();
  
  // Memoize versions sorting to prevent unnecessary recalculations
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => b.version_number - a.version_number);
  }, [versions]);
  
  // Skip logging on tab changes by checking for visibility events
  const shouldLog = useMemo(() => {
    try {
      const lastVisibilityChange = parseInt(sessionStorage.getItem('last_visibility_change') || '0', 10);
      // Only log if not a recent visibility change (within the last 2 seconds)
      return Date.now() - lastVisibilityChange > 2000;
    } catch (e) {
      return true;
    }
  }, []);
  
  // Only log when appropriate to reduce noise
  if (shouldLog) {
    console.log("TrackVersionsDrawer - Versions:", versions.map(v => ({ id: v.id, version: v.version_number })));
  }
  
  // Memoize latest version detection
  const latestVersion = useMemo(() => {
    return sortedVersions.find(v => v.is_latest_version) || sortedVersions[0];
  }, [sortedVersions]);
  
  // Memoize create new version handler
  const handleCreateNewVersion = useMemo(() => {
    return () => navigate(`/track/${trackId}/version`);
  }, [navigate, trackId]);

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
});

// Add display name for debugging
TrackVersionsDrawer.displayName = "TrackVersionsDrawer";

export default TrackVersionsDrawer;
