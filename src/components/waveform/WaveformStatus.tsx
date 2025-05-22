
import React from 'react';
import { Loader } from 'lucide-react';

interface WaveformStatusProps {
  isBuffering: boolean;
  showBufferingUI: boolean;
  isMp3Available: boolean;
  analysisError: string | null;
  isAudioLoading: boolean;
  currentTime: number;
  usedPrecomputedPeaks?: boolean; // New prop to track if we're using pre-computed peaks
}

const WaveformStatus: React.FC<WaveformStatusProps> = ({
  isBuffering,
  showBufferingUI,
  isMp3Available,
  analysisError,
  isAudioLoading,
  currentTime,
  usedPrecomputedPeaks = false
}) => {
  // Format current time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Show buffering indicator
  if (isBuffering && showBufferingUI) {
    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/30 z-10">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 text-wip-pink animate-spin" />
          <div className="text-sm text-wip-pink">Buffering audio...</div>
        </div>
      </div>
    );
  }
  
  // Show audio loading indicator
  if (isAudioLoading) {
    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/20 z-10">
        <div className="flex flex-col items-center">
          <div className="text-sm text-wip-light opacity-80">Loading audio...</div>
        </div>
      </div>
    );
  }
  
  // Show error message if analysis failed
  if (analysisError) {
    return (
      <div className="absolute bottom-2 right-2 z-10">
        <div className="text-xs text-red-400">
          {analysisError}
        </div>
      </div>
    );
  }
  
  return (
    <div className="absolute bottom-2 right-2 flex flex-row gap-2 z-10">
      {/* Show peaks data indicator only in development mode */}
      {process.env.NODE_ENV === 'development' && usedPrecomputedPeaks && (
        <span className="text-xs bg-purple-800/70 text-purple-200 px-2 py-1 rounded-md">
          Pre-computed peaks
        </span>
      )}
      
      {/* Playback quality indicator */}
      {isMp3Available && (
        <span className="text-xs bg-blue-800/70 text-blue-200 px-2 py-1 rounded-md">
          MP3 quality
        </span>
      )}
      
      {/* Current time */}
      <span className="text-xs bg-black/70 text-white px-2 py-1 rounded-md">
        {formatTime(currentTime)}
      </span>
    </div>
  );
};

export default WaveformStatus;
