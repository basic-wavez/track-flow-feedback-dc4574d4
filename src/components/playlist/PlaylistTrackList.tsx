
import React from "react";
import { PlaylistTrack } from "@/types/playlist";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { useLocation } from "react-router-dom";

interface PlaylistTrackListProps {
  tracks: PlaylistTrack[];
}

const PlaylistTrackList: React.FC<PlaylistTrackListProps> = ({ tracks }) => {
  const { 
    currentTrackIndex, 
    playTrack, 
    isPlaying, 
    togglePlayPause 
  } = usePlaylistPlayer();
  
  const location = useLocation();
  const isSharedRoute = location.pathname.includes('/shared/');

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-6 space-y-1">
      {tracks.map((track, index) => (
        <div 
          key={track.id}
          className={`flex items-center p-3 rounded-md transition-colors ${
            currentTrackIndex === index 
              ? "bg-wip-dark border border-wip-pink/30" 
              : "bg-wip-darker hover:bg-wip-dark/50"
          }`}
        >
          <div className="w-8 text-center text-gray-400 mr-2">
            {index + 1}
          </div>
          
          <div className="flex-grow">
            <div className="font-medium">
              {track.track?.title || "Unknown Track"}
            </div>
            <div className="text-xs text-gray-400">
              {track.track?.original_filename || "Unknown file"}
            </div>
          </div>
          
          <div className="text-sm text-gray-400 mr-4">
            {track.duration ? formatDuration(track.duration) : "--:--"}
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            className={`text-white h-8 w-8 ${currentTrackIndex === index ? "bg-wip-pink/20" : ""}`}
            onClick={() => {
              if (currentTrackIndex === index) {
                togglePlayPause();
              } else {
                playTrack(index);
              }
            }}
          >
            {currentTrackIndex === index && isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PlaylistTrackList;
