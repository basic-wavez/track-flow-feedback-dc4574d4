
import React, { memo } from "react";
import { PlaylistTrack } from "@/types/playlist";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { useLocation } from "react-router-dom";

interface PlaylistTrackListProps {
  tracks: PlaylistTrack[];
}

const TrackItem = memo(({ 
  track, 
  index, 
  isActive, 
  isPlaying, 
  onTrackClick 
}: { 
  track: PlaylistTrack; 
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onTrackClick: () => void;
}) => {
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`flex items-center p-3 rounded-md transition-colors ${
        isActive 
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
        className={`text-white h-8 w-8 ${isActive ? "bg-wip-pink/20" : ""}`}
        onClick={onTrackClick}
      >
        {isActive && isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>
    </div>
  );
});

TrackItem.displayName = "TrackItem";

const PlaylistTrackList: React.FC<PlaylistTrackListProps> = ({ tracks }) => {
  const { 
    currentTrackIndex, 
    playTrack, 
    isPlaying, 
    togglePlayPause 
  } = usePlaylistPlayer();
  
  return (
    <div className="mt-6 space-y-1">
      {tracks.map((track, index) => (
        <TrackItem 
          key={track.id}
          track={track}
          index={index}
          isActive={currentTrackIndex === index}
          isPlaying={isPlaying}
          onTrackClick={() => {
            if (currentTrackIndex === index) {
              togglePlayPause();
            } else {
              playTrack(index);
            }
          }}
        />
      ))}
    </div>
  );
};

export default memo(PlaylistTrackList);
