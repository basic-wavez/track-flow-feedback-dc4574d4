
import React from 'react';

interface WavFormatNoticeProps {
  isPlayingWav: boolean;
  processingStatus: string;
}

/**
 * Shows a notice when playing WAV file directly
 */
const WavFormatNotice = ({ isPlayingWav, processingStatus }: WavFormatNoticeProps) => {
  if (isPlayingWav && processingStatus === 'pending') {
    return (
      <div className="text-blue-400 text-sm mb-2 bg-blue-900/20 p-2 rounded">
        Playing WAV file directly. MP3 version is being processed in the background for better streaming quality.
      </div>
    );
  }
  
  return null;
};

export default WavFormatNotice;
