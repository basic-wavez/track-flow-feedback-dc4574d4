
interface WaveformStatusProps {
  isBuffering?: boolean;
  showBufferingUI?: boolean;
  isMp3Available?: boolean;
  analysisError?: string | null;
  isAudioLoading?: boolean;
  currentTime?: number;
  audioQuality?: string; // Audio quality indicator
}

const WaveformStatus = ({ 
  isBuffering, 
  showBufferingUI = false, 
  isMp3Available, 
  analysisError, 
  isAudioLoading,
  currentTime = 0,
  audioQuality
}: WaveformStatusProps) => {
  return (
    <>
      {analysisError && (
        <div className="absolute bottom-4 left-4 text-xs text-amber-300 bg-wip-darker/80 px-3 py-1 rounded-full">
          Using fallback visualization
        </div>
      )}
      
      {showBufferingUI && (
        <div className="absolute top-4 right-4 text-xs text-blue-300 bg-wip-darker/80 px-3 py-1 rounded-full animate-pulse">
          Buffering...
        </div>
      )}
      
      {audioQuality && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-wip-darker/80 px-3 py-1 rounded-full">
          {audioQuality}
        </div>
      )}
    </>
  );
};

export default WaveformStatus;
