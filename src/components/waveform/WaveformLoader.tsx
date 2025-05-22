
import { Loader } from 'lucide-react';

interface WaveformLoaderProps {
  isAnalyzing?: boolean;
  isGeneratingWaveform?: boolean;
  isLoadingPeaks?: boolean;
}

const WaveformLoader = ({ isAnalyzing, isGeneratingWaveform, isLoadingPeaks }: WaveformLoaderProps) => {
  // Show analyzing state when processing actual audio file
  if (isAnalyzing) {
    return (
      <div className="w-full h-32 relative flex items-center justify-center bg-wip-darker/50 rounded-md">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 text-wip-pink animate-spin" />
          <div className="text-sm text-wip-pink">Analyzing audio waveform...</div>
        </div>
      </div>
    );
  }
  
  // Show loading state when loading pre-computed peaks data
  if (isLoadingPeaks) {
    return (
      <div className="w-full h-32 relative flex items-center justify-center bg-wip-darker/50 rounded-md">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 text-wip-pink animate-spin" />
          <div className="text-sm text-wip-pink">Loading waveform data...</div>
        </div>
      </div>
    );
  }
  
  // Show waveform loading state when generating waveform for MP3
  if (isGeneratingWaveform) {
    return (
      <div className="w-full h-32 relative flex items-center justify-center bg-wip-darker/50 rounded-md">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 text-wip-pink animate-spin" />
          <div className="text-sm text-wip-pink">Generating waveform...</div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default WaveformLoader;
