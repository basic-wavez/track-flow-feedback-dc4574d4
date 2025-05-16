
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
  inCooldownPeriod = false
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
      
      <Waveform 
        audioUrl={playbackUrl}
        waveformAnalysisUrl={waveformAnalysisUrl}
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
      />
      
      {/* Show cooldown message with more detail */}
      {shareKey && (
        <div className="mt-4 text-xs text-center">
          {isCooldown ? (
            <div className="text-amber-400">
              This track has been played recently. Play count will increment after the cooldown period (10 minutes).
            </div>
          ) : playedRecently ? (
            <div className="text-green-400">
              Play count has been incremented for this track.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TrackPlayer;
