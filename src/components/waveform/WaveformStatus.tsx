
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
  // Show no loading text, only analysis error if present
  return (
    <>
      {analysisError && (
        <div className="absolute bottom-4 left-4 text-xs text-amber-300 bg-wip-darker/80 px-3 py-1 rounded-full">
          Using fallback visualization
        </div>
      )}
    </>
  );
};

export default WaveformStatus;
