
import React from 'react';
import { useAudioPlayer } from '@/providers/GlobalAudioProvider';
import { Pause, Play, SkipBack, Volume1, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface PlayerControlsProps {
  className?: string;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({ className = '' }) => {
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    volume,
    isMuted,
    togglePlayPause, 
    seek,
    setVolume,
    toggleMute,
    playbackState,
  } = useAudioPlayer();
  
  const isLoading = playbackState === 'loading';
  
  // Handle seek to beginning
  const handleSeekToBeginning = () => {
    seek(0);
  };
  
  // Format times for display
  const formattedCurrentTime = formatTime(currentTime);
  const formattedDuration = formatTime(duration);
  
  // Handle volume slider change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
  };
  
  // Calculate progress percentage for progress bar
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Time and controls row */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">{formattedCurrentTime}</div>
        
        <div className="flex items-center space-x-4">
          {/* Skip back button */}
          <button 
            onClick={handleSeekToBeginning}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Skip to beginning"
          >
            <SkipBack size={20} className="text-white" />
          </button>
          
          {/* Play/pause button */}
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className={`p-3 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={24} className="text-white" />
            ) : (
              <Play size={24} className="text-white ml-1" />
            )}
          </button>
        </div>
        
        <div className="text-sm text-gray-300">{formattedDuration}</div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-1.5 relative">
        <div 
          className="bg-purple-500 h-full rounded-full transition-all" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Volume controls */}
      <div className="flex items-center space-x-2 mt-2">
        <button 
          onClick={toggleMute}
          className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={16} className="text-gray-400" />
          ) : volume < 0.5 ? (
            <Volume1 size={16} className="text-gray-300" />
          ) : (
            <Volume2 size={16} className="text-gray-300" />
          )}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          aria-label="Volume"
        />
      </div>
    </div>
  );
};

export default PlayerControls;
