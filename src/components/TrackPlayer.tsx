
import { useState, useRef, useEffect } from "react";
import Waveform from "./Waveform";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TrackHeader from "./player/TrackHeader";
import PlaybackControls from "./player/PlaybackControls";
import TrackActions from "./player/TrackActions";
import { isInServerCooldown } from "@/services/trackShareService";

interface TrackPlayerProps {
  trackId: string;
  trackName: string;
  audioUrl?: string;
  originalUrl?: string;
  waveformAnalysisUrl?: string;
  originalFilename?: string;
  isOwner?: boolean;
  processingStatus?: string;
  mp3Url?: string;
  shareKey?: string;
  inCooldownPeriod?: boolean;
  downloadsEnabled?: boolean;
  versionNumber?: number;
}

const TrackPlayer = ({ 
  trackId, 
  trackName, 
  audioUrl, 
  originalUrl,
  waveformAnalysisUrl,
  originalFilename,
  isOwner = false,
  processingStatus = 'completed',
  mp3Url,
  shareKey,
  inCooldownPeriod = false,
  downloadsEnabled = false,
  versionNumber = 1
}: TrackPlayerProps) => {
  // Local states
  const [serverCooldown, setServerCooldown] = useState(false);
  const [playedRecently, setPlayedRecently] = useState(false);
  
  // Determine which URL to use for playback - prefer MP3 if available
  const playbackUrl = mp3Url || audioUrl;
  
  // Check server cooldown on load
  useEffect(() => {
    const checkServerCooldown = async () => {
      if (shareKey) {
        const inCooldown = await isInServerCooldown(shareKey);
        setServerCooldown(inCooldown);
      }
    };
    
    checkServerCooldown();
  }, [shareKey]);
  
  // Use custom hook for audio playback
  const {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackState,
    isGeneratingWaveform,
    audioLoaded,
    showBufferingUI,
    isBuffering,
    togglePlayPause,
    handleSeek,
    toggleMute,
    handleVolumeChange,
  } = useAudioPlayer({ 
    mp3Url: playbackUrl,
    trackId,
    shareKey 
  });
  
  // Update playedRecently when a track finishes playing
  useEffect(() => {
    if (playbackState === 'paused' && currentTime > 0 && currentTime >= duration * 0.9) {
      setPlayedRecently(true);
      
      // Check if we're now in server cooldown
      if (shareKey) {
        const checkServerCooldown = async () => {
          const inCooldown = await isInServerCooldown(shareKey);
          setServerCooldown(inCooldown);
        };
        
        checkServerCooldown();
      }
    }
  }, [playbackState, currentTime, duration, shareKey]);
  
  // Check if we're using the MP3 version
  const usingMp3 = !!mp3Url;
  const isLoading = playbackState === 'loading';
  
  // Determine combined cooldown state
  const isCooldown = inCooldownPeriod || serverCooldown;
  
  // Determine whether to display MP3 processing message
  const showMp3ProcessingMessage = !mp3Url && processingStatus === 'pending';
  
  // Calculate a reliable waveform URL - always prioritize MP3
  const reliableWaveformUrl = mp3Url || audioUrl;

  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      {/* Main audio element */}
      <audio 
        ref={audioRef} 
        src={playbackUrl}
        preload="auto"
      />
      
      <TrackHeader 
        trackId={trackId}
        trackName={trackName}
        playbackState={playbackState}
        isLoading={isLoading}
        usingMp3={usingMp3}
        processingStatus={processingStatus}
        showProcessButton={false}
        isRequestingProcessing={false}
        onRequestProcessing={async () => {}}
        isOwner={isOwner}
        versionNumber={versionNumber}
      />
      
      <PlaybackControls 
        isPlaying={isPlaying}
        playbackState={playbackState}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isLoading={isLoading}
        onPlayPause={togglePlayPause}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
      />
      
      {showMp3ProcessingMessage && (
        <div className="text-yellow-400 text-sm mb-2 bg-yellow-900/20 p-2 rounded">
          MP3 version is still processing. Waveform and playback may be limited until processing completes.
        </div>
      )}
      
      <Waveform 
        audioUrl={reliableWaveformUrl}
        waveformAnalysisUrl={reliableWaveformUrl}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        totalChunks={1}
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={usingMp3}
        isGeneratingWaveform={isGeneratingWaveform}
        audioLoaded={audioLoaded}
      />
      
      <TrackActions 
        isOwner={isOwner}
        originalUrl={originalUrl}
        originalFilename={originalFilename}
        trackId={trackId}
        downloadsEnabled={downloadsEnabled}
        shareKey={shareKey}
      />
    </div>
  );
};

export default TrackPlayer;
