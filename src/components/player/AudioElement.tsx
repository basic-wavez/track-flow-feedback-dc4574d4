
import React, { RefObject } from 'react';

interface AudioElementProps {
  audioRef: RefObject<HTMLAudioElement>;
  playbackUrl?: string;
}

const AudioElement: React.FC<AudioElementProps> = ({ audioRef, playbackUrl }) => {
  return (
    <audio 
      ref={audioRef} 
      src={playbackUrl}
      preload="auto"
      crossOrigin="anonymous"
    />
  );
};

export default AudioElement;
