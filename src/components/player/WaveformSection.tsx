
import React, { useState, useCallback, useEffect } from 'react';
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
  // Debug logging for component lifecycle
  useEffect(() => {
    console.log(`WaveformSection mounted/updated for trackId: ${trackId}`);
    return () => {
      console.log(`WaveformSection unmounted for trackId: ${trackId}`);
    };
  }, [trackId]);
  
  // Check if we're on mobile
  const isMobile = useIsMobile();
  
  // State to track if we should analyze audio (only if database loading fails)
  const [shouldAnalyzeAudio, setShouldAnalyzeAudio] = useState(false);
  
  // Reset shouldAnalyzeAudio when trackId changes
  useEffect(() => {
    setShouldAnalyzeAudio(false);
  }, [trackId]);
  
  // Handle database loading completion
  const handleDatabaseLoadingComplete = useCallback((success: boolean) => {
    // Only start analysis if database loading failed
    if (!success) {
      console.log("Database loading failed, starting client-side audio analysis");
      setShouldAnalyzeAudio(true);
    } else {
      console.log("Using waveform data from database, skipping client-side analysis");
    }
  }, []);
  
  // Use our audio analysis hook with conditional execution
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
    },
    skipInitialAnalysis: true // Don't start analyzing immediately
  });
  
  // Trigger analysis if we should analyze
  useEffect(() => {
    if (shouldAnalyzeAudio && audioRef.current && !isAnalyzing) {
      console.log("Triggering audio analysis as fallback");
      analyzeAudio();
    }
  }, [shouldAnalyzeAudio, audioRef, analyzeAudio, isAnalyzing]);
  
  // Just use the analyzed data if available
  const finalWaveformData = analyzedWaveformData;
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Waveform component - key prop forces remount when trackId changes */}
      <Waveform 
        key={`waveform-${trackId}`} 
        audioUrl={playbackUrl}
        peaksDataUrl={waveformPeaksUrl}
        trackId={trackId}
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
        onDatabaseLoadingComplete={handleDatabaseLoadingComplete}
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
      
      {/* Updated visualizer with key prop to force remount when trackId changes */}
      {showFFTVisualizer && (
        <div className="mt-2 mb-6">
          <MultiVisualizer 
            key={`visualizer-${trackId}`}
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
