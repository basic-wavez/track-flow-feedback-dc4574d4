
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Share, Download, Volume2, VolumeX } from "lucide-react";
import Waveform from "./Waveform";
import { getTrackChunkUrls } from "@/services/trackService";

interface TrackPlayerProps {
  trackId: string;
  trackName: string;
  audioUrl?: string;
  isOwner?: boolean;
}

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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Use a default audio sample if no audioUrl is provided
  const defaultAudioUrl = "https://assets.mixkit.co/active_storage/sfx/5135/5135.wav";
  
  // Load chunk URLs when component mounts
  useEffect(() => {
    const loadChunkUrls = async () => {
      if (!trackId) {
        setChunkUrls(audioUrl ? [audioUrl] : [defaultAudioUrl]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const urls = await getTrackChunkUrls(trackId);
        
        if (urls.length === 0) {
          // Fallback to provided audioUrl if no chunks found
          setChunkUrls(audioUrl ? [audioUrl] : [defaultAudioUrl]);
        } else {
          setChunkUrls(urls);
          console.log("Loaded chunk URLs:", urls);
        }
      } catch (error) {
        console.error("Error loading audio chunks:", error);
        setChunkUrls(audioUrl ? [audioUrl] : [defaultAudioUrl]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChunkUrls();
  }, [trackId, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    
    const handleEnd = () => {
      // Check if there are more chunks to play
      if (currentChunkIndex < chunkUrls.length - 1) {
        setCurrentChunkIndex(prevIndex => prevIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };
    
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [currentChunkIndex, chunkUrls]);

  // When current chunk index changes, load and play the new chunk
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || chunkUrls.length === 0) return;
    
    audio.src = chunkUrls[currentChunkIndex];
    
    if (isPlaying) {
      audio.load();
      audio.play().catch(error => {
        console.error("Playback failed:", error);
      });
    }
  }, [currentChunkIndex, chunkUrls]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error("Playback failed:", error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio || chunkUrls.length === 0) return;
    
    // If we have multiple chunks, need to determine which chunk to play
    if (chunkUrls.length > 1) {
      // Calculate total duration (approximate)
      let totalDuration = duration * chunkUrls.length;
      
      // Find which chunk contains the target time
      const targetChunkIndex = Math.min(
        Math.floor(time / duration),
        chunkUrls.length - 1
      );
      
      // Calculate the time within that chunk
      const timeWithinChunk = time - (targetChunkIndex * duration);
      
      // Set the new chunk and seek to that time
      setCurrentChunkIndex(targetChunkIndex);
      
      // Need to wait for the new chunk to load before seeking
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = timeWithinChunk;
        }
      }, 100);
      
    } else {
      // Simple case: just one audio chunk
      audio.currentTime = time;
      setCurrentTime(time);
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
        alert("Link copied to clipboard!");
      })
      .catch(err => {
        console.error("Could not copy link:", err);
      });
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      {/* Audio element with proper source */}
      <audio 
        ref={audioRef} 
        src={chunkUrls.length > 0 ? chunkUrls[currentChunkIndex] : defaultAudioUrl} 
      />
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold gradient-text">{trackName}</h2>
          <p className="text-gray-400 text-sm">
            {isLoading ? 'Loading audio...' : `${chunkUrls.length} audio chunks loaded`}
          </p>
        </div>
        <Badge variant="outline" className="border-wip-pink text-wip-pink">
          Work In Progress
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <Button 
          onClick={togglePlayPause} 
          size="icon" 
          className="h-12 w-12 rounded-full gradient-bg hover:opacity-90"
          disabled={isLoading}
        >
          {isPlaying ? (
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
