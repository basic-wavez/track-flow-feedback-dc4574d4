
interface WaveformStatusProps {
  isBuffering?: boolean;
  isMp3Available?: boolean;
  analysisError?: string | null;
  isAudioLoading?: boolean;
}

const WaveformStatus = ({ isBuffering, isMp3Available, analysisError, isAudioLoading }: WaveformStatusProps) => {
  return (
    <>
      {isBuffering && (
        <div className="absolute bottom-4 right-4 text-sm text-wip-pink bg-wip-darker/80 px-3 py-1 rounded-full">
          Buffering...
        </div>
      )}
      {isMp3Available && (
        <div className="absolute top-4 right-4 text-xs text-green-300 bg-wip-darker/80 px-3 py-1 rounded-full">
          High Quality MP3
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
