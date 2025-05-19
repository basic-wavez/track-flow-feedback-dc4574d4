
import React from 'react';

interface PlaylistModeIndicatorProps {
  isPlaylistMode: boolean;
  currentIndex: number;
  totalTracks: number;
}

const PlaylistModeIndicator: React.FC<PlaylistModeIndicatorProps> = ({
  isPlaylistMode,
  currentIndex,
  totalTracks
}) => {
  if (isPlaylistMode && currentIndex >= 0 && totalTracks > 0) {
    return (
      <div className="text-sm text-gray-400 mb-3">
        Track {currentIndex + 1} of {totalTracks}
      </div>
    );
  }
  
  return null;
};

export default PlaylistModeIndicator;
