
interface WaveformStatusProps {
  isBuffering?: boolean;
  showBufferingUI?: boolean;
  isMp3Available?: boolean;
  analysisError?: string | null;
  isAudioLoading?: boolean;
  currentTime?: number;
}

const WaveformStatus = ({ 
  isBuffering, 
  showBufferingUI = false, 
  isMp3Available, 
  analysisError, 
  isAudioLoading,
  currentTime = 0
}: WaveformStatusProps) => {
  // Only show buffering indicator if:
  // 1. We're explicitly told to show it (showBufferingUI is true)
  // 2. Current playback time is greater than 2 seconds (not just started playing)
  const shouldShowBuffering = showBufferingUI && currentTime > 2;

  return (
    <>
      {/* Only show buffering UI when explicitly told to AND not at start of playback */}
      {shouldShowBuffering && (
        <div className="absolute bottom-4 right-4 text-sm text-wip-pink bg-wip-darker/80 px-3 py-1 rounded-full">
          Buffering...
        </div>
      )}
      {isAudioLoading && (
        <div className="absolute bottom-4 left-4 text-xs text-amber-300 bg-wip-darker/80 px-3 py-1 rounded-full">
          Loading audio...
        </div>
      )}
      {analysisError && (
        <div className="absolute bottom-4 left-4 text-xs text-amber-300 bg-wip-darker/80 px-3 py-1 rounded-full">
          Using fallback visualization
        </div>
      )}
    </>
  );
};

export default WaveformStatus;
