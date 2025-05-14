
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Share, Download, Volume2, VolumeX } from "lucide-react";
import Waveform from "./Waveform";

interface TrackPlayerProps {
  trackName: string;
  audioUrl?: string;
  isOwner?: boolean;
}

const TrackPlayer = ({ trackName, audioUrl, isOwner = false }: TrackPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [downloadEnabled, setDownloadEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Use a default audio sample if no audioUrl is provided
  const defaultAudioUrl = "https://assets.mixkit.co/active_storage/sfx/5135/5135.wav";
  const audioSource = audioUrl || defaultAudioUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnd = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

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
    if (!audio) return;
    
    audio.currentTime = time;
    setCurrentTime(time);
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
      <audio ref={audioRef} src={audioSource} />
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold gradient-text">{trackName}</h2>
          <p className="text-gray-400 text-sm">Uploaded by You</p>
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
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>
        
        <div className="text-sm font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
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
        audioUrl={audioSource}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
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
