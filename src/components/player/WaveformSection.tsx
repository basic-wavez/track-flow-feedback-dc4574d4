import React, { useEffect, useState, useCallback } from 'react';
import Waveform from "../Waveform";
import MultiVisualizer from '../visualizer/MultiVisualizer';
import TrackActions from './TrackActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { isValidPeaksData } from '@/lib/waveformUtils';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { createPeaksCacheKey, savePeaksToCache } from '@/lib/peaksDataUtils';
import { saveTrackWaveformData } from '@/services/trackWaveformService';

interface WaveformSectionProps {
  playbackUrl: string | undefined;
  waveformPeaksUrl?: string | undefined;
  waveformUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  handleSeek: (time: number) => void;
  isBuffering: boolean;
  showBufferingUI: boolean;
  usingMp3: boolean;
  usingOpus: boolean;
  isGeneratingWaveform: boolean;
  audioLoaded: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  showFFTVisualizer?: boolean;
  // Track action props
  isOwner: boolean;
  originalUrl?: string;
  originalFilename?: string;
  trackId: string;
  downloadsEnabled?: boolean;
  shareKey?: string;
  trackVersions?: any[];
  trackTitle?: string;
  isPlaylistMode?: boolean;
}

const WaveformSection: React.FC<WaveformSectionProps> = ({
  playbackUrl,
  waveformPeaksUrl,
  waveformUrl,
  isPlaying,
  currentTime,
  duration,
  handleSeek,
  isBuffering,
  showBufferingUI,
  usingMp3,
  usingOpus,
  isGeneratingWaveform,
  audioLoaded,
  audioRef,
  showFFTVisualizer = true,
  // Track action props
  isOwner = false,
  originalUrl,
  originalFilename,
  trackId,
  downloadsEnabled = false,
  shareKey,
  trackVersions = [],
  trackTitle = "",
  isPlaylistMode = false
}) => {
  // Check if we're on mobile
  const isMobile = useIsMobile();
  
  // State for waveform data
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [peaksLoaded, setPeaksLoaded] = useState(false);
  
  // Use our new audio analysis hook when no peaks URL is available
  const { 
    waveformData: analyzedWaveformData, 
    isAnalyzing,
    error: analysisError,
    analyzeAudio
  } = useAudioAnalysis({
    audioRef,
    audioUrl: playbackUrl,
    onAnalysisComplete: (peaks) => {
      // Save analyzed peaks to local cache
      if (trackId) {
        const cacheKey = createPeaksCacheKey(`analyzed_${trackId}`);
        savePeaksToCache(cacheKey, peaks);
        
        // Also save to Supabase for persistence across sessions
        if (isOwner) {
          console.log("Saving browser-analyzed waveform data to Supabase");
          saveTrackWaveformData(trackId, peaks)
            .then(success => {
              if (success) {
                console.log("Successfully saved waveform data to database");
              }
            });
        }
      }
    }
  });
  
  // Load peaks data from URL or use analyzed data
  const loadPeaksData = useCallback(async () => {
    if (!trackId || peaksLoaded) return;
    
    try {
      // Try to load from localStorage first (using our existing utility)
      const cacheKey = `waveform_peaks_${trackId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (isValidPeaksData(parsedData)) {
            console.log('Using cached waveform peaks data from localStorage');
            setWaveformData(Float32Array.from(parsedData));
            setPeaksLoaded(true);
            return;
          }
        } catch (e) {
          console.warn('Error parsing cached peaks data:', e);
          localStorage.removeItem(cacheKey);
        }
      }
      
      // If no cached data and we have a peaks URL, fetch it
      if (waveformPeaksUrl) {
        console.log('Fetching peaks data from URL:', waveformPeaksUrl);
        const response = await fetch(waveformPeaksUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch peaks data: ${response.status}`);
        }
        
        const peaksData = await response.json();
        
        if (isValidPeaksData(peaksData)) {
          console.log('Successfully loaded pre-computed waveform peaks:', peaksData.length, 'points');
          
          // Convert to Float32Array for direct rendering
          const typedArray = Float32Array.from(peaksData);
          setWaveformData(typedArray);
          setPeaksLoaded(true);
          
          // Cache the data for future use
          try {
            localStorage.setItem(cacheKey, JSON.stringify(peaksData));
          } catch (e) {
            console.warn('Failed to cache waveform peaks data:', e);
          }
          return;
        }
      }
      
      // If we get here, we couldn't load peaks from URL or cache
      // In that case we rely on the analyzed data
    } catch (error) {
      console.error('Error loading peaks data:', error);
    }
  }, [waveformPeaksUrl, trackId, peaksLoaded]);
  
  // Try to load peaks data on mount or when URLs change
  useEffect(() => {
    loadPeaksData();
  }, [loadPeaksData]);
  
  // Set the final waveform data to use for rendering
  // Priority: 1. Loaded peaks from URL/cache, 2. Analyzed data, 3. None (will use placeholder)
  const finalWaveformData = waveformData || analyzedWaveformData;
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Waveform component with our waveform data */}
      <Waveform 
        audioUrl={playbackUrl}
        peaksDataUrl={waveformPeaksUrl}
        waveformData={finalWaveformData || undefined}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        totalChunks={1}
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={usingMp3}
        isOpusAvailable={usingOpus}
        isGeneratingWaveform={isGeneratingWaveform || isAnalyzing}
        audioLoaded={audioLoaded}
      />
      
      {/* Track Actions (Download/Share buttons) */}
      {!isPlaylistMode && (
        <div className="mb-4">
          <TrackActions 
            isOwner={isOwner}
            originalUrl={originalUrl}
            originalFilename={originalFilename}
            trackId={trackId}
            downloadsEnabled={downloadsEnabled}
            shareKey={shareKey}
            trackVersions={trackVersions}
            trackTitle={trackTitle}
          />
        </div>
      )}
      
      {/* Updated visualizer with dynamic height based on device */}
      {showFFTVisualizer && (
        <div className="mt-2 mb-6">
          <MultiVisualizer 
            audioRef={audioRef}
            isPlaying={isPlaying}
            className={isMobile ? "w-full" : "h-[150px] w-full"}
          />
        </div>
      )}
    </div>
  );
};

export default WaveformSection;
