import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Share, Download, Volume2, VolumeX, Loader, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Waveform from "./Waveform";
import { getTrackChunkUrls, getTrack, requestTrackProcessing } from "@/services/trackService";

interface TrackPlayerProps {
  trackId: string;
  trackName: string;
  audioUrl?: string;
  isOwner?: boolean;
}

// Playback states for clearer state management
type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error';

const TrackPlayer = ({ trackId, trackName, audioUrl, isOwner = false }: TrackPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [downloadEnabled, setDownloadEnabled] = useState(false);
  const [chunkUrls, setChunkUrls] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [loadRetries, setLoadRetries] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isRequestingProcessing, setIsRequestingProcessing] = useState(false);
  const [usingMp3, setUsingMp3] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const nextAudioRef = useRef<HTMLAudioElement>(null);
  
  // Use a default audio sample if no audioUrl is provided
  const defaultAudioUrl = "https://assets.mixkit.co/active_storage/sfx/5135/5135.wav";
  
  // Load track details and chunk URLs when component mounts
  useEffect(() => {
    const loadTrackDetails = async () => {
      if (!trackId) {
        setChunkUrls(audioUrl ? [audioUrl] : [defaultAudioUrl]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setPlaybackState('loading');
        
        // Get track details
        const track = await getTrack(trackId);
        if (track) {
          setProcessingStatus(track.processing_status || 'pending');
          
          // Check if MP3 is available
          if (track.mp3_url && track.processing_status === 'completed') {
            console.log("Using processed MP3 for playback");
            setChunkUrls([track.mp3_url]);
            setUsingMp3(true);
            setIsLoading(false);
            setPlaybackState('idle');
            return;
          }
        }
        
        // Fall back to chunks
        const urls = await getTrackChunkUrls(trackId);
        
        if (urls.length === 0) {
          // Fallback to provided audioUrl if no chunks found
          setChunkUrls(audioUrl ? [audioUrl] : [defaultAudioUrl]);
        } else {
          setChunkUrls(urls);
          setUsingMp3(urls.length === 1 && track?.mp3_url === urls[0]);
          console.log(`Loaded ${urls.length} audio URLs:`, urls);
        }
      } catch (error) {
        console.error("Error loading audio:", error);
        setChunkUrls(audioUrl ? [audioUrl] : [defaultAudioUrl]);
        setPlaybackState('error');
        toast({
          title: "Error Loading Audio",
          description: "Could not load the audio. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        if (playbackState === 'loading') {
          setPlaybackState('idle');
        }
      }
    };
    
    loadTrackDetails();
    
    // Poll for processing status updates if we're not using MP3
    const statusInterval = setInterval(async () => {
      if (!trackId || usingMp3) return;
      
      try {
        const track = await getTrack(trackId);
        if (track) {
          const newStatus = track.processing_status || 'pending';
          setProcessingStatus(newStatus);
          
          // If processing just completed, reload the track
          if (newStatus === 'completed' && processingStatus !== 'completed' && track.mp3_url) {
            setChunkUrls([track.mp3_url]);
            setUsingMp3(true);
            setCurrentChunkIndex(0);
            setCurrentTime(0);
            
            toast({
              title: "MP3 Processing Complete",
              description: "High quality MP3 version is now available for streaming"
            });
            
            // Stop polling once we have the MP3
            clearInterval(statusInterval);
          }
        }
      } catch (error) {
        console.error("Error checking processing status:", error);
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [trackId, audioUrl, usingMp3]);

  // Preload the next chunk when current chunk is playing
  useEffect(() => {
    if (!nextAudioRef.current || chunkUrls.length <= 1 || currentChunkIndex >= chunkUrls.length - 1) {
      return;
    }
    
    const nextChunkUrl = chunkUrls[currentChunkIndex + 1];
    if (nextChunkUrl) {
      nextAudioRef.current.src = nextChunkUrl;
      nextAudioRef.current.load();
      console.log(`Preloading next chunk: ${currentChunkIndex + 1}`);
    }
  }, [currentChunkIndex, chunkUrls]);

  // Main audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    
    const handleEnd = () => {
      console.log(`Chunk ${currentChunkIndex} ended. Total chunks: ${chunkUrls.length}`);
      
      // Check if there are more chunks to play
      if (currentChunkIndex < chunkUrls.length - 1) {
        setPlaybackState('buffering');
        setCurrentChunkIndex(prevIndex => prevIndex + 1);
      } else {
        setIsPlaying(false);
        setPlaybackState('idle');
        setCurrentTime(0);
        setCurrentChunkIndex(0);
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      console.log(`Chunk ${currentChunkIndex} metadata loaded. Duration: ${audio.duration}`);
    };
    
    const handleCanPlay = () => {
      console.log(`Chunk ${currentChunkIndex} can play now`);
      if (playbackState === 'buffering' && isPlaying) {
        audio.play()
          .then(() => {
            setPlaybackState('playing');
            setLoadRetries(0);
          })
          .catch(error => {
            console.error(`Error playing chunk ${currentChunkIndex}:`, error);
            handlePlaybackError();
          });
      } else if (playbackState === 'loading') {
        setPlaybackState('idle');
      }
    };
    
    const handleWaiting = () => {
      console.log(`Chunk ${currentChunkIndex} is waiting/buffering`);
      setPlaybackState('buffering');
    };
    
    const handleError = () => {
      console.error(`Error with chunk ${currentChunkIndex}`);
      handlePlaybackError();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    // Set volume and muted state
    audio.volume = volume;
    audio.muted = isMuted;

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
    };
  }, [currentChunkIndex, chunkUrls, isPlaying, playbackState]);

  // Handle playback errors with retry logic
  const handlePlaybackError = () => {
    if (loadRetries < 3) {
      setLoadRetries(prev => prev + 1);
      setPlaybackState('loading');
      
      // Retry loading the current chunk
      const audio = audioRef.current;
      if (audio && chunkUrls[currentChunkIndex]) {
        console.log(`Retrying chunk ${currentChunkIndex} (attempt ${loadRetries + 1})`);
        setTimeout(() => {
          audio.load();
        }, 1000); // Wait a second before retrying
      }
    } else {
      setPlaybackState('error');
      setIsPlaying(false);
      toast({
        title: "Playback Error",
        description: "Could not play this track. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // When current chunk index changes, load and play the new chunk
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || chunkUrls.length === 0) return;
    
    const currentChunkUrl = chunkUrls[currentChunkIndex];
    
    if (!currentChunkUrl) {
      console.error(`No URL found for chunk ${currentChunkIndex}`);
      handlePlaybackError();
      return;
    }
    
    console.log(`Loading chunk ${currentChunkIndex}: ${currentChunkUrl}`);
    audio.src = currentChunkUrl;
    
    // Reset the time for the new chunk
    if (currentChunkIndex > 0) {
      setCurrentTime(0);
    }
    
    audio.load();
    
    if (isPlaying) {
      setPlaybackState('buffering');
    }
  }, [currentChunkIndex, chunkUrls]);

  // Toggle play/pause with improved error handling
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || chunkUrls.length === 0) return;

    if (isPlaying) {
      audio.pause();
      setPlaybackState('paused');
      setIsPlaying(false);
    } else {
      setPlaybackState('buffering');
      audio.play()
        .then(() => {
          setPlaybackState('playing');
          setIsPlaying(true);
        })
        .catch(error => {
          console.error("Playback failed:", error);
          handlePlaybackError();
        });
    }
  };

  // Improved seeking with chunk awareness
  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio || chunkUrls.length === 0) return;
    
    // Calculate total duration (approximate)
    const estimatedTotalDuration = duration * chunkUrls.length;
    
    // Find which chunk contains the target time
    const targetChunkIndex = Math.min(
      Math.floor(time / duration),
      chunkUrls.length - 1
    );
    
    // Calculate the time within that chunk
    const timeWithinChunk = time - (targetChunkIndex * duration);
    
    console.log(`Seeking to ${time}s overall, chunk ${targetChunkIndex}, position ${timeWithinChunk}s`);
    
    // If we need to change chunks
    if (targetChunkIndex !== currentChunkIndex) {
      setPlaybackState('buffering');
      setCurrentChunkIndex(targetChunkIndex);
      
      // We'll set the time after the new chunk loads
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = timeWithinChunk;
          
          // If we were playing before seeking, continue playing
          if (isPlaying) {
            audioRef.current.play()
              .catch(error => {
                console.error("Error resuming after seek:", error);
                handlePlaybackError();
              });
          }
        }
      }, 300); // Short delay to ensure the new chunk has started loading
    } else {
      // Simple case: just seek within current chunk
      audio.currentTime = timeWithinChunk;
      setCurrentTime(timeWithinChunk);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      audio.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate total duration across all chunks
  const getTotalDuration = () => {
    if (chunkUrls.length <= 1) return duration;
    
    // Each chunk should be roughly the same duration
    return duration * chunkUrls.length;
  };
  
  // Calculate current position across all chunks
  const getCurrentPosition = () => {
    return (currentChunkIndex * duration) + currentTime;
  };

  const handleDownload = () => {
    // In a real app, this would initiate a download of the original file
    alert("Download functionality would be implemented here");
  };

  const handleShare = () => {
    // In a real app, this would generate a shareable link
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Track link copied to clipboard!",
        });
      })
      .catch(err => {
        console.error("Could not copy link:", err);
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard.",
          variant: "destructive",
        });
      });
  };

  // Request MP3 processing for better streaming quality
  const handleRequestProcessing = async () => {
    if (!trackId || isRequestingProcessing) return;
    
    setIsRequestingProcessing(true);
    try {
      await requestTrackProcessing(trackId);
      // Update status immediately for better UX
      setProcessingStatus('queued');
    } finally {
      setIsRequestingProcessing(false);
    }
  };

  // Determine if we should show the process button
  const showProcessButton = isOwner && 
    (!usingMp3 || processingStatus === 'failed') && 
    processingStatus !== 'processing' && 
    processingStatus !== 'queued';

  // Helper function to render processing status
  const renderProcessingStatus = () => {
    if (!isOwner || usingMp3) return null;
    
    switch (processingStatus) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-gray-700 text-gray-300">
            MP3 Processing Pending
          </Badge>
        );
      case 'queued':
        return (
          <Badge variant="outline" className="bg-blue-900 text-blue-200 border-blue-700">
            MP3 Processing Queued
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-amber-900 text-amber-200 border-amber-700 flex items-center gap-1">
            <Loader className="h-3 w-3 animate-spin" />
            MP3 Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-900 text-red-200 border-red-700">
            MP3 Processing Failed
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-900 text-green-200 border-green-700">
            MP3 Processing Complete
          </Badge>
        );
      default:
        return null;
    }
  };

  // Helper function to render playback status indicator
  const renderPlaybackStatus = () => {
    switch (playbackState) {
      case 'buffering':
        return (
          <div className="flex items-center gap-2 text-wip-pink animate-pulse">
            <Loader className="h-4 w-4 animate-spin" />
            <span>Buffering...</span>
          </div>
        );
      case 'error':
        return <span className="text-red-500">Error loading audio</span>;
      default:
        if (isLoading) {
          return <span className="text-gray-400">Loading audio...</span>;
        }
        if (usingMp3) {
          return <span className="text-green-400">Using high-quality MP3</span>;
        }
        return <span className="text-gray-400">{chunkUrls.length} audio chunks loaded</span>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      {/* Main audio element */}
      <audio 
        ref={audioRef} 
        src={chunkUrls.length > 0 ? chunkUrls[currentChunkIndex] : defaultAudioUrl}
        preload="auto"
      />
      
      {/* Hidden audio element for preloading next chunk */}
      <audio 
        ref={nextAudioRef} 
        preload="auto" 
        style={{ display: 'none' }}
      />
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold gradient-text">{trackName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-400 text-sm">
              {renderPlaybackStatus()}
            </p>
            {renderProcessingStatus()}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showProcessButton && (
            <Button
              onClick={handleRequestProcessing}
              variant="outline"
              size="sm"
              className="border-wip-pink text-wip-pink hover:bg-wip-pink/10 flex gap-1 items-center"
              disabled={isRequestingProcessing}
            >
              {isRequestingProcessing ? (
                <Loader className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Process MP3
            </Button>
          )}
          <Badge variant="outline" className="border-wip-pink text-wip-pink">
            Work In Progress
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <Button 
          onClick={togglePlayPause} 
          size="icon" 
          className="h-12 w-12 rounded-full gradient-bg hover:opacity-90"
          disabled={isLoading || playbackState === 'error'}
        >
          {playbackState === 'buffering' ? (
            <Loader className="h-6 w-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>
        
        <div className="text-sm font-mono">
          {formatTime(getCurrentPosition())} / {formatTime(getTotalDuration())}
        </div>
        
        <div className="flex items-center ml-auto gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={toggleMute}
            className="text-gray-400 hover:text-white hover:bg-transparent"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24"
          />
        </div>
      </div>
      
      <Waveform 
        audioUrl={chunkUrls.length > 0 ? chunkUrls[0] : undefined}
        isPlaying={isPlaying}
        currentTime={getCurrentPosition()}
        duration={getTotalDuration()}
        onSeek={handleSeek}
        totalChunks={chunkUrls.length}
        isBuffering={playbackState === 'buffering'}
      />
      
      <div className="mt-6 flex justify-between items-center">
        {isOwner && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Enable Downloads:</span>
            <Switch
              checked={downloadEnabled}
              onCheckedChange={setDownloadEnabled}
            />
          </div>
        )}
        
        <div className="flex gap-2 ml-auto">
          {downloadEnabled && (
            <Button 
              onClick={handleDownload} 
              variant="outline" 
              className="gap-2 border-wip-pink text-wip-pink hover:bg-wip-pink/10"
            >
              <Download className="h-4 w-4" />
              Download Original
            </Button>
          )}
          
          <Button 
            onClick={handleShare} 
            className="gap-2 gradient-bg hover:opacity-90"
          >
            <Share className="h-4 w-4" />
            Share for Feedback
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrackPlayer;
