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
  
  // State for waveform data - removed redundant loading logic
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  
  // Use our audio analysis hook when no peaks URL is available or loaded data
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
  
  // Just use the analyzed data if available
  const finalWaveformData = analyzedWaveformData;
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Waveform component - now pass trackId to ensure database loading works */}
      <Waveform 
        audioUrl={playbackUrl}
        peaksDataUrl={waveformPeaksUrl}
        trackId={trackId} // Add trackId here to ensure it's passed down
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
