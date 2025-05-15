
interface WaveformStatusProps {
  isBuffering?: boolean;
  showBufferingUI?: boolean;
  isMp3Available?: boolean;
  analysisError?: string | null;
  isAudioLoading?: boolean;
}

const WaveformStatus = ({ 
  isBuffering, 
  showBufferingUI = false, 
  isMp3Available, 
  analysisError, 
  isAudioLoading 
}: WaveformStatusProps) => {
  return (
    <>
      {/* Only show when specifically told to */}
      {showBufferingUI && (
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
