
import { useEffect, useRef, useState } from 'react';
import { generateWaveformData } from '@/lib/audioUtils';
import { Loader } from 'lucide-react';

interface WaveformProps {
  audioUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  totalChunks?: number;
  isBuffering?: boolean;
  isMp3Available?: boolean;
  isGeneratingWaveform?: boolean;
}

const Waveform = ({ 
  audioUrl, 
  isPlaying, 
  currentTime, 
  duration, 
  onSeek,
  totalChunks = 1,
  isBuffering = false,
  isMp3Available = false,
  isGeneratingWaveform = false
}: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  
  // Generate waveform data when component mounts or audioUrl changes
  // Only regenerate if the MP3 becomes available or the URL changes
  useEffect(() => {
    if (!audioUrl) return;
    
    // If we already have waveform data for this audioUrl, don't regenerate
    // unless it's specifically for an MP3 that just became available
    if (isWaveformGenerated && !isMp3Available) return;
    
    // Generate more detailed waveform data for MP3 files
    const segments = isMp3Available 
      ? 200 // More segments for MP3 for better visualization
      : Math.max(150, 50 * totalChunks);
    
    // In a production app, we'd analyze the actual MP3 file here
    // For now, we'll generate random data with a more realistic pattern for MP3
    const newWaveformData = generateWaveformData(
      segments, 
      isMp3Available ? 0.4 : 0.2 // Higher variance for MP3 waveforms
    );
    
    setWaveformData(newWaveformData);
    setIsWaveformGenerated(true);
  }, [audioUrl, totalChunks, isMp3Available]);
  
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
        
        // Determine color based on playback position and MP3 availability
        if (x < progressPixel) {
          // Gradient for played section - brighter for MP3
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          if (isMp3Available) {
            // Higher quality MP3 visualization with richer colors
            gradient.addColorStop(0, 'rgba(241, 172, 210, 0.95)'); // Brighter pink for MP3
            gradient.addColorStop(1, 'rgba(210, 133, 181, 0.85)'); // Darker shade with more opacity
          } else {
            // Standard visualization for chunks
            gradient.addColorStop(0, 'rgba(231, 162, 200, 0.9)'); 
            gradient.addColorStop(1, 'rgba(200, 123, 171, 0.7)');
          }
          ctx.fillStyle = gradient;
        } else {
          // Color for unplayed section
          ctx.fillStyle = isMp3Available 
            ? 'rgba(241, 172, 210, 0.4)' // Higher opacity for MP3
            : 'rgba(231, 162, 200, 0.3)'; 
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
  }, [isPlaying, isBuffering, currentTime, duration, waveformData, isMp3Available]);
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekPosition = x / canvas.width;
    
    onSeek(duration * seekPosition);
  };
  
  // Show waveform loading state when generating waveform for MP3
  if (isGeneratingWaveform) {
    return (
      <div className="w-full h-32 relative flex items-center justify-center bg-wip-darker/50 rounded-md">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 text-wip-pink animate-spin" />
          <div className="text-sm text-wip-pink">Generating waveform...</div>
        </div>
      </div>
    );
  }
  
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
      {isMp3Available && (
        <div className="absolute top-4 right-4 text-xs text-green-300 bg-wip-darker/80 px-3 py-1 rounded-full">
          High Quality MP3
        </div>
      )}
    </div>
  );
};

export default Waveform;
