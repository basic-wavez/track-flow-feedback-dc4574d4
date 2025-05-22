
import { RefObject } from 'react';

interface UseWaveformSeekProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  duration: number;
  onSeek: (time: number) => void;
}

export const useWaveformSeek = ({
  canvasRef,
  duration,
  onSeek
}: UseWaveformSeekProps) => {
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Don't allow seeking if duration is invalid
    if (!isFinite(duration) || isNaN(duration) || duration <= 0) {
      console.log("Cannot seek: Invalid duration");
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Important: Use the display width (rect.width) rather than the canvas width
    // This ensures the seekPosition aligns with the visible position clicked
    const seekPosition = x / rect.width;
    
    // Ensure seekPosition is valid
    if (isFinite(seekPosition) && !isNaN(seekPosition)) {
      onSeek(duration * seekPosition);
    }
  };

  return { handleClick };
};
