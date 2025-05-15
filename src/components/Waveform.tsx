
import { useEffect, useState } from 'react';
import { analyzeAudio } from '@/lib/audioUtils';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import WaveformLoader from './waveform/WaveformLoader';
import WaveformCanvas from './waveform/WaveformCanvas';
import WaveformStatus from './waveform/WaveformStatus';
import { Json } from '@/integrations/supabase/types';
import { updateWaveformData } from '@/services/trackUpdateService';

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
  waveformData?: number[] | Json; // Database waveform data
  trackId?: string; // Added trackId prop to save waveform data
  isOwner?: boolean; // Added to check if user can save waveform data
}

// Helper function to normalize waveform data to number[]
const normalizeWaveformData = (data: number[] | Json | undefined): number[] => {
  if (!data) return [];
  
  // If data is already a number array, return it
  if (Array.isArray(data) && typeof data[0] === 'number') {
    return data as number[];
  }
  
  // If data is a JSON string, try to parse it
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && typeof parsed[0] === 'number') {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse waveform data:', e);
    }
  }
  
  // If data is a JSON object that is an array, convert to number array
  if (Array.isArray(data)) {
    return data.map(item => Number(item));
  }
  
  // Fallback to empty array if conversion fails
  return [];
};

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
  audioLoaded = false,
  waveformData: storedWaveformData, // Rename to avoid confusion
  trackId, // Track ID for saving waveform data
  isOwner = false // Whether current user is the track owner
}: WaveformProps) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [savedToDatabase, setSavedToDatabase] = useState(false);

  // Generate initial placeholder waveform immediately
  useEffect(() => {
    if (waveformData.length === 0) {
      const initialWaveformData = generateWaveformWithVariance(150, 0.3);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Use stored waveform data from database if available, otherwise analyze or generate
  useEffect(() => {
    if (!audioUrl) return;
    
    // If we have stored waveform data from the database, normalize and use it
    if (storedWaveformData) {
      const normalizedData = normalizeWaveformData(storedWaveformData);
      if (normalizedData.length > 0) {
        console.log('Using waveform data from database:', normalizedData.length, 'points');
        setWaveformData(normalizedData);
        setIsWaveformGenerated(true);
        return;
      }
    }
    
    // If we already have waveform data for this audioUrl, don't regenerate
    // unless it's specifically for an MP3 that just became available
    if (isWaveformGenerated && !isMp3Available) return;
    
    // Determine number of segments for the waveform
    const segments = 200; // Consistent number of segments for better visualization
    
    // For MP3 files, analyze the actual audio data
    if (isMp3Available && audioUrl && audioLoaded) {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      analyzeAudio(audioUrl, segments)
        .then(analyzedData => {
          if (analyzedData && analyzedData.length > 0) {
            console.log('Audio analysis complete. Generated waveform with', analyzedData.length, 'points');
            setWaveformData(analyzedData);
            setIsWaveformGenerated(true);
            
            // If user is the owner, save the waveform data to the database
            if (isOwner && trackId && !savedToDatabase) {
              console.log('Saving waveform data to database for track:', trackId);
              updateWaveformData(trackId, analyzedData)
                .then(success => {
                  if (success) {
                    console.log('Waveform data saved to database');
                    setSavedToDatabase(true);
                  }
                })
                .catch(error => {
                  console.error('Failed to save waveform data:', error);
                });
            }
          } else {
            throw new Error("No waveform data generated from analysis");
          }
        })
        .catch(error => {
          console.error("Error analyzing audio:", error);
          setAnalysisError("Failed to analyze audio. Using fallback visualization.");
          
          // Fall back to generated data
          const fallbackData = generateWaveformWithVariance(segments, 0.4);
          setWaveformData(fallbackData);
          setIsWaveformGenerated(true);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    } else {
      // For non-MP3 or when analysis fails, use generated data
      const newWaveformData = generateWaveformWithVariance(
        segments, 
        isMp3Available ? 0.4 : 0.2 // Higher variance for MP3 waveforms
      );
      
      setWaveformData(newWaveformData);
      setIsWaveformGenerated(true);
    }
  }, [audioUrl, totalChunks, isMp3Available, isWaveformGenerated, audioLoaded, storedWaveformData, trackId, isOwner, savedToDatabase]);
  
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
