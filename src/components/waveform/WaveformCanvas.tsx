
import { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  waveformData: number[];
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
  
  useEffect(() => {
    const drawWaveform = () => {
      const canvas = canvasRef.current;
      if (!canvas || waveformData.length === 0) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear the canvas
      ctx.clearRect(0, 0, width, height);
      
      // Calculate the progress position
      const isValidDuration = isFinite(duration) && duration > 0;
      const progress = isValidDuration ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
      const progressPixel = width * progress;
      
      // Draw the waveform bars - using vertical bars style from screenshot
      const barWidth = width / waveformData.length;
      const barMargin = Math.max(1, barWidth * 0.2); // Ensure at least 1px margin
      const effectiveBarWidth = Math.max(1, barWidth - barMargin); // Ensure at least 1px width
      
      for (let i = 0; i < waveformData.length; i++) {
        const x = i * barWidth;
        const amplitude = waveformData[i];
        const barHeight = Math.max(2, height * amplitude * 0.8); // Ensure minimum height and scale to 80% of canvas
        
        // Position bars from bottom, matching screenshot design
        const y = height - barHeight;
        
        // Determine color based on playback position
        if (x < progressPixel) {
          // Played section - brighter pink
          ctx.fillStyle = 'rgba(241, 172, 210, 0.95)';
        } else {
          // Unplayed section - darker pink with more transparency
          ctx.fillStyle = 'rgba(241, 172, 210, 0.4)'; 
        }
        
        // Draw the bar as a vertical rectangle
        ctx.fillRect(x + barMargin/2, y, effectiveBarWidth, barHeight);
      }
      
      // Add progress line
      if (isValidDuration && progressPixel > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(progressPixel - 1, 0, 2, height);
      }
      
      // Add buffering indicator
      if (isBuffering) {
        const bufferingWidth = 20;
        const bufferingX = Math.min(progressPixel + 2, width - bufferingWidth);
        
        // Draw buffering animation pulse
        const pulseAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
        ctx.fillRect(bufferingX, 0, bufferingWidth, height);
      }
    };
    
    // Draw the waveform
    drawWaveform();
    
    // Set up animation if playing or buffering
    let animationFrame: number;
    if (isPlaying || isBuffering) {
      const animate = () => {
        drawWaveform();
        animationFrame = requestAnimationFrame(animate);
      };
      
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, isBuffering, currentTime, duration, waveformData, isMp3Available]);
  
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
  
  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={150}
      className="w-full h-full rounded-md waveform-bg cursor-pointer"
      onClick={handleClick}
    />
  );
};

export default WaveformCanvas;
