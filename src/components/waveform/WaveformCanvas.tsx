
import { useRef } from 'react';
import { useWaveformRenderer } from './hooks/useWaveformRenderer';
import { useWaveformSeek } from './hooks/useWaveformSeek';

interface WaveformCanvasProps {
  waveformData: number[] | Float32Array; // Updated to accept Float32Array
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isMp3Available: boolean;
  onSeek: (time: number) => void;
}

const WaveformCanvas = ({ 
  waveformData, 
  currentTime, 
  duration, 
  isPlaying, 
  isBuffering,
  isMp3Available, 
  onSeek 
}: WaveformCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use our custom renderer hook
  useWaveformRenderer({
    canvasRef,
    waveformData,
    currentTime,
    duration,
    isPlaying,
    isBuffering,
    isMp3Available
  });
  
  // Use our custom seek hook
  const { handleClick } = useWaveformSeek({
    canvasRef,
    duration,
    onSeek
  });
  
  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={150}
      className={`w-full h-full rounded-md waveform-bg ${isFinite(duration) && duration > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
      onClick={handleClick}
    />
  );
};

export default WaveformCanvas;
