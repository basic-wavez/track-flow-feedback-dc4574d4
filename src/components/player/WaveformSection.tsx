
import React, { useEffect, useState } from 'react';
import Waveform from "../Waveform";
import MultiVisualizer from '../visualizer/MultiVisualizer';
import TrackActions from './TrackActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { isValidPeaksData } from '@/lib/waveformUtils';

interface WaveformSectionProps {
  playbackUrl: string | undefined;
  waveformPeaksUrl?: string | undefined;
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
  // New props for track actions
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
  
  // Load and store the waveform peaks data
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  
  useEffect(() => {
    async function loadPeaksData() {
      if (!waveformPeaksUrl || !trackId) return;
      
      try {
        // Try to load from localStorage first
        const cacheKey = `waveform_peaks_${trackId}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            if (isValidPeaksData(parsedData)) {
              console.log('Using cached waveform peaks data from localStorage');
              setWaveformData(Float32Array.from(parsedData));
              return;
            }
          } catch (e) {
            console.warn('Error parsing cached peaks data:', e);
            localStorage.removeItem(cacheKey);
          }
        }
        
        // Fetch from server if not in cache
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
          
          // Cache the data for future use
          try {
            localStorage.setItem(cacheKey, JSON.stringify(peaksData));
          } catch (e) {
            console.warn('Failed to cache waveform peaks data:', e);
          }
        }
      } catch (error) {
        console.error('Error loading peaks data:', error);
      }
    }
    
    loadPeaksData();
  }, [waveformPeaksUrl, trackId]);
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Waveform comes first - now using direct waveformData instead of waveformAnalysisUrl */}
      <Waveform 
        audioUrl={playbackUrl}
        peaksDataUrl={waveformPeaksUrl}
        waveformData={waveformData || undefined}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        totalChunks={1}
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={usingMp3}
        isOpusAvailable={usingOpus}
        isGeneratingWaveform={isGeneratingWaveform}
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
