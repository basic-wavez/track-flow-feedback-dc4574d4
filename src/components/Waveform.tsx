
import { useEffect, useRef, useState } from 'react';
import { generateWaveformData } from '@/lib/audioUtils';

interface WaveformProps {
  audioUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  totalChunks?: number;
  isBuffering?: boolean;
}

const Waveform = ({ 
  audioUrl, 
  isPlaying, 
  currentTime, 
  duration, 
  onSeek,
  totalChunks = 1,
  isBuffering = false
}: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  // Generate waveform data when component mounts or audioUrl changes
  useEffect(() => {
    // For a complete implementation, we would extract actual waveform data from audio
    // For now, generate more segments for multi-chunk tracks
    const segments = Math.max(150, 50 * totalChunks);
    setWaveformData(generateWaveformData(segments));
  }, [audioUrl, totalChunks]);
  
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
      const progress = duration > 0 ? currentTime / duration : 0;
      const progressPixel = width * progress;
      
      // Draw the waveform bars
      const barWidth = width / waveformData.length;
      const barMargin = barWidth * 0.2;
      const effectiveBarWidth = barWidth - barMargin;
      
      for (let i = 0; i < waveformData.length; i++) {
        const x = i * barWidth;
        const amplitude = waveformData[i] * 0.7; // Reduce max height to 70% of canvas
        const barHeight = height * amplitude;
        const y = (height - barHeight) / 2;
        
        // Determine color based on playback position
        if (x < progressPixel) {
          // Gradient for played section
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(231, 162, 200, 0.9)'); // Updated to new pink color
          gradient.addColorStop(1, 'rgba(200, 123, 171, 0.7)'); // Darker shade of the pink
          ctx.fillStyle = gradient;
        } else {
          // Color for unplayed section
          ctx.fillStyle = 'rgba(231, 162, 200, 0.3)'; // Updated to new pink color with low opacity
        }
        
        // Draw the bar
        ctx.fillRect(x + barMargin/2, y, effectiveBarWidth, barHeight);
        
        // Add a subtle pulsing effect to bars near the current position when playing
        if ((isPlaying || isBuffering) && x >= progressPixel - barWidth * 5 && x <= progressPixel + barWidth * 5) {
          const distance = Math.abs(x - progressPixel) / (barWidth * 5);
          const pulseOpacity = isBuffering ? 0.7 - (distance * 0.7) : 0.5 - (distance * 0.5);
          
          if (pulseOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
            const pulseFactor = isBuffering ? 1 + (0.3 * (1 - distance)) : 1 + (0.2 * (1 - distance));
            const pulseHeight = barHeight * pulseFactor;
            const pulseY = (height - pulseHeight) / 2;
            ctx.fillRect(x + barMargin/2, pulseY, effectiveBarWidth, pulseHeight);
          }
        }
      }
      
      // Draw progress line
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(progressPixel - 1, 0, 2, height);
      
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
  }, [isPlaying, isBuffering, currentTime, duration, waveformData]);
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekPosition = x / canvas.width;
    
    onSeek(duration * seekPosition);
  };
  
  return (
    <div className="w-full h-32 relative">
      <canvas
        ref={canvasRef}
        width={1000}
        height={150}
        className="w-full h-full cursor-pointer rounded-md waveform-bg"
        onClick={handleClick}
      />
      {isBuffering && (
        <div className="absolute bottom-4 right-4 text-sm text-wip-pink bg-wip-darker/80 px-3 py-1 rounded-full">
          Buffering...
        </div>
      )}
    </div>
  );
};

export default Waveform;
