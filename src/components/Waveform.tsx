
import { useEffect, useState } from 'react';
import { analyzeAudio } from '@/lib/audioUtils';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import WaveformLoader from './waveform/WaveformLoader';
import WaveformCanvas from './waveform/WaveformCanvas';
import WaveformStatus from './waveform/WaveformStatus';

interface WaveformProps {
  audioUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  totalChunks?: number;
  isBuffering?: boolean;
  showBufferingUI?: boolean;
  isMp3Available?: boolean;
  isGeneratingWaveform?: boolean;
  audioLoaded?: boolean;
}

const Waveform = ({ 
  audioUrl, 
  isPlaying, 
  currentTime, 
  duration, 
  onSeek,
  totalChunks = 1,
  isBuffering = false,
  showBufferingUI = false,
  isMp3Available = false,
  isGeneratingWaveform = false,
  audioLoaded = false
}: WaveformProps) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Generate initial placeholder waveform immediately
  useEffect(() => {
    if (waveformData.length === 0) {
      const initialWaveformData = generateWaveformWithVariance(150, 0.3);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Try to analyze waveform data when audio URL is available and audio is loaded
  useEffect(() => {
    if (!audioUrl) return;
    
    // If we already have analyzed waveform data for this audioUrl, don't regenerate
    if (isWaveformGenerated && !isMp3Available) return;
    
    // Determine number of samples for the waveform
    const segments = isMp3Available 
      ? 200 // More segments for MP3 for better visualization
      : Math.max(150, 50 * totalChunks);
    
    // Only attempt audio analysis if the audio is loaded and URL is available
    if (audioUrl && audioLoaded) {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      analyzeAudio(audioUrl, segments)
        .then(analyzedData => {
          if (analyzedData && analyzedData.length > 0) {
            setWaveformData(analyzedData);
            setIsWaveformGenerated(true);
          } else {
            throw new Error("No waveform data generated from analysis");
          }
        })
        .catch(error => {
          console.error("Error analyzing audio:", error);
          setAnalysisError("Failed to analyze audio. Using fallback visualization.");
          
          // Fall back to generated data with higher variance for more realistic appearance
          const fallbackData = generateWaveformWithVariance(segments, 0.4);
          setWaveformData(fallbackData);
          setIsWaveformGenerated(true);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    } else if (!isWaveformGenerated) {
      // For cases where analysis isn't possible yet, use generated data as placeholder
      const newWaveformData = generateWaveformWithVariance(
        segments, 
        isMp3Available ? 0.4 : 0.2 // Higher variance for better looking waveforms
      );
      
      setWaveformData(newWaveformData);
      setIsWaveformGenerated(true);
    }
  }, [audioUrl, totalChunks, isMp3Available, audioLoaded, isWaveformGenerated]);
  
  // Show loading states
  if (isAnalyzing) {
    return <WaveformLoader isAnalyzing={true} />;
  }
  
  if (isGeneratingWaveform) {
    return <WaveformLoader isGeneratingWaveform={true} />;
  }
  
  const isAudioDurationValid = isFinite(duration) && duration > 0;
  
  return (
    <div className="w-full h-32 relative">
      <WaveformCanvas 
        waveformData={waveformData}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        isMp3Available={isMp3Available}
        onSeek={onSeek}
      />
      
      <WaveformStatus 
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={isMp3Available}
        analysisError={analysisError}
        isAudioLoading={!isAudioDurationValid && !analysisError}
        currentTime={currentTime}
      />
    </div>
  );
};

export default Waveform;
