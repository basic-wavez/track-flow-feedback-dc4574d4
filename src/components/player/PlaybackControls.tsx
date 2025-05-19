
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";

interface PlaybackControlsProps {
  isPlaying: boolean;
  playbackState: string;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading?: boolean;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

const PlaybackControls = ({
  isPlaying,
  playbackState,
  currentTime,
  duration,
  volume,
  isMuted,
  isLoading = false,
  onPlayPause,
  onVolumeChange,
  onToggleMute
}: PlaybackControlsProps) => {
  const isMobile = useIsMobile();
  
  const formatTime = (time: number) => {
    // Handle invalid time values
    if (!isFinite(time) || isNaN(time)) {
      return "--:--";
    }
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Determine if the button should be disabled
  // Only disable if explicitly in error state or loading state
  const isButtonDisabled = playbackState === 'error' || isLoading;

  return (
    <div className="flex items-center gap-4 mb-4">
      <Button 
        onClick={onPlayPause} 
        size="icon" 
        className="h-12 w-12 rounded-full gradient-bg hover:opacity-90"
        disabled={isButtonDisabled}
      >
        {isLoading ? (
          <Play className="h-6 w-6 ml-1 opacity-50" />
        ) : isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 ml-1" />
        )}
      </Button>
      
      <div className="text-sm font-mono">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      
      {!isMobile && (
        <div className="flex items-center ml-auto gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onToggleMute}
            className="text-gray-400 hover:text-white hover:bg-transparent"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[volume]}
            onValueChange={(value) => onVolumeChange(value[0])}
            className="w-24"
          />
        </div>
      )}
    </div>
  );
};

export default PlaybackControls;
