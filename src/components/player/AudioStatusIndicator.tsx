
import React from 'react';

interface AudioStatusIndicatorProps {
  isPlayingWav: boolean;
  processingStatus: string;
}

const AudioStatusIndicator: React.FC<AudioStatusIndicatorProps> = ({ 
  isPlayingWav,
  processingStatus
}) => {
  if (isPlayingWav && processingStatus === 'pending') {
    return (
      <div className="text-blue-400 text-sm mb-2 bg-blue-900/20 p-2 rounded">
        Playing WAV file directly. MP3 version is being processed in the background for better streaming quality.
      </div>
    );
  }
  
  return null;
};

export default AudioStatusIndicator;
