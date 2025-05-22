
import { Loader } from "lucide-react";

interface WaveformLoaderProps {
  isAnalyzing?: boolean;
  isGeneratingWaveform?: boolean;
  message?: string;
}

const WaveformLoader: React.FC<WaveformLoaderProps> = ({
  isAnalyzing = false,
  isGeneratingWaveform = false,
  message
}) => {
  // Determine the message text based on props
  let displayMessage = message;
  
  if (!displayMessage) {
    if (isAnalyzing) {
      displayMessage = "Analyzing audio waveform...";
    } else if (isGeneratingWaveform) {
      displayMessage = "Generating waveform...";
    } else {
      displayMessage = "Loading...";
    }
  }
  
  return (
    <div className="w-full h-32 flex items-center justify-center bg-wip-darker rounded-md border border-wip-gray opacity-80">
      <div className="flex flex-col items-center">
        <Loader className="animate-spin h-6 w-6 text-wip-pink mb-2" />
        <span className="text-sm text-gray-400">
          {displayMessage}
        </span>
      </div>
    </div>
  );
};

export default WaveformLoader;
