
import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { 
  Clock, 
  ExternalLink, 
  Share2, 
  History,
  FilePlus,
  Trash2 
} from "lucide-react";
import { TrackWithVersions, TrackData } from "@/types/track";
import TrackVersionsDrawer from "@/components/track/TrackVersionsDrawer";
import MobileTrackCard from "@/components/track/MobileTrackCard";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface TrackListProps {
  tracks: TrackWithVersions[];
  isLoading: boolean;
  onDeletePrompt: (trackId: string, title: string) => void;
}

const TrackList = memo(({ tracks, isLoading, onDeletePrompt }: TrackListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Handler for sharing a track
  const handleShareTrack = (trackId: string) => {
    const shareUrl = `${window.location.origin}/track/${trackId}`;
    navigator.clipboard.writeText(shareUrl)
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
  
  // Handler for opening a track
  const handleOpenTrack = (trackId: string) => {
    navigate(`/track/${trackId}`);
  };
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading your tracks...</p>
      </div>
    );
  }
  
  if (tracks.length === 0) {
    return (
      <div className="py-8 md:py-12 text-center border border-dashed border-wip-gray/30 rounded-md">
        <p className="text-base md:text-lg text-gray-400 mb-4">You haven't uploaded any tracks yet</p>
        <Button onClick={() => navigate("/")}>
          Upload Your First Track
        </Button>
      </div>
    );
  }
  
  return (
    <>
      {/* Desktop View */}
      {!isMobile && (
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => (
                <TableRow key={track.id} className={track.versions.length > 1 ? "border-b-0" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {track.title}
                      {track.versions.length > 1 && (
                        <Badge variant="outline" className="ml-2">
                          {track.versions.length} versions
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(track.created_at || ""), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {track.feedbackCount} {track.feedbackCount === 1 ? 'review' : 'reviews'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {track.versions.length > 1 ? (
                      <TrackVersionsDrawer 
                        trackId={track.id}
                        trackTitle={track.title}
                        versions={track.versions}
                      >
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <History className="h-3.5 w-3.5" />
                          View All
                        </Button>
                      </TrackVersionsDrawer>
                    ) : (
                      <Badge variant="outline">v{track.versions[0]?.version_number || 1}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="flex gap-2 items-center"
                        onClick={() => handleOpenTrack(track.versions.find(v => v.is_latest_version)?.id || track.id)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex gap-2 items-center"
                        onClick={() => handleShareTrack(track.versions.find(v => v.is_latest_version)?.id || track.id)}
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex gap-2 items-center"
                        onClick={() => navigate(`/track/${track.versions.find(v => v.is_latest_version)?.id || track.id}/version`)}
                      >
                        <FilePlus className="h-4 w-4" />
                        New Version
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex gap-2 items-center text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDeletePrompt(track.id, track.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Mobile View */}
      <div className={`${isMobile ? 'block' : 'hidden'} md:hidden`}>
        {tracks.map((track) => (
          <MobileTrackCard 
            key={track.id}
            track={track}
            onShareTrack={handleShareTrack}
            onDeletePrompt={onDeletePrompt}
          />
        ))}
      </div>
    </>
  );
});

TrackList.displayName = "TrackList"; // For React DevTools

export default TrackList;
