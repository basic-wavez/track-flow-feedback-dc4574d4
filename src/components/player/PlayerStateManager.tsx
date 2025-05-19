
import { useState, useEffect } from "react";
import { isInServerCooldown } from "@/services/trackShareService";

interface PlayerStateManagerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  shareKey?: string;
  playbackState: string;
  currentTime: number;
  duration: number;
  children: (state: {
    serverCooldown: boolean;
    playedRecently: boolean;
  }) => React.ReactNode;
}

const PlayerStateManager: React.FC<PlayerStateManagerProps> = ({
  audioRef,
  shareKey,
  playbackState,
  currentTime,
  duration,
  children
}) => {
  const [serverCooldown, setServerCooldown] = useState(false);
  const [playedRecently, setPlayedRecently] = useState(false);
  
  // Check server cooldown on load
  useEffect(() => {
    if (!shareKey) return;
    
    const checkServerCooldown = async () => {
      const inCooldown = await isInServerCooldown(shareKey);
      setServerCooldown(inCooldown);
    };
    
    checkServerCooldown();
  }, [shareKey]);
  
  // Update playedRecently when a track finishes playing
  useEffect(() => {
    if (playbackState !== 'paused' || currentTime <= 0 || currentTime < duration * 0.9) return;
    
    setPlayedRecently(true);
    
    if (!shareKey) return;
    
    const checkServerCooldown = async () => {
      const inCooldown = await isInServerCooldown(shareKey);
      setServerCooldown(inCooldown);
    };
    
    checkServerCooldown();
  }, [playbackState, currentTime, duration, shareKey]);
  
  return (
    <>
      {children({
        serverCooldown,
        playedRecently
      })}
    </>
  );
};

export default PlayerStateManager;
