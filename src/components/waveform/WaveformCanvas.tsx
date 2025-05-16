
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
      
      // Draw the waveform bars
      const barWidth = width / waveformData.length;
      const barMargin = barWidth * 0.2;
      const effectiveBarWidth = barWidth - barMargin;
      
      for (let i = 0; i < waveformData.length; i++) {
        const x = i * barWidth;
        const amplitude = waveformData[i] * 0.85; // Use more of canvas height (85%)
        const barHeight = height * amplitude;
        const y = (height - barHeight) / 2;
        
        // Determine color based on playback position and MP3 availability
        if (x < progressPixel) {
          // Gradient for played section - brighter for analyzed waveforms
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          if (isMp3Available) {
            // Higher quality visualization with richer colors
            gradient.addColorStop(0, 'rgba(255, 182, 220, 0.95)'); // Brighter pink at top
            gradient.addColorStop(1, 'rgba(210, 133, 181, 0.9)');  // Deeper pink at bottom
          } else {
            // Standard visualization
            gradient.addColorStop(0, 'rgba(241, 172, 210, 0.95)'); 
            gradient.addColorStop(1, 'rgba(200, 123, 171, 0.8)');
          }
          ctx.fillStyle = gradient;
        } else {
          // Color for unplayed section - slightly different for analyzed vs generated
          ctx.fillStyle = isMp3Available 
            ? 'rgba(241, 172, 210, 0.45)' // Higher opacity for analyzed audio
            : 'rgba(231, 162, 200, 0.35)'; 
        }
        
        // Draw the bar with rounded corners for a smoother look
        ctx.beginPath();
        const radius = Math.min(effectiveBarWidth / 2, 3);
        
        // Top-left corner
        ctx.moveTo(x + barMargin/2 + radius, y);
        // Top-right corner
        ctx.lineTo(x + barMargin/2 + effectiveBarWidth - radius, y);
        ctx.quadraticCurveTo(x + barMargin/2 + effectiveBarWidth, y, 
                            x + barMargin/2 + effectiveBarWidth, y + radius);
        // Bottom-right corner
        ctx.lineTo(x + barMargin/2 + effectiveBarWidth, y + barHeight - radius);
        ctx.quadraticCurveTo(x + barMargin/2 + effectiveBarWidth, y + barHeight,
                            x + barMargin/2 + effectiveBarWidth - radius, y + barHeight);
        // Bottom-left corner
        ctx.lineTo(x + barMargin/2 + radius, y + barHeight);
        ctx.quadraticCurveTo(x + barMargin/2, y + barHeight,
                            x + barMargin/2, y + barHeight - radius);
        // Back to top-left
        ctx.lineTo(x + barMargin/2, y + radius);
        ctx.quadraticCurveTo(x + barMargin/2, y, 
                            x + barMargin/2 + radius, y);
        
        ctx.fill();
        
        // Add a subtle pulsing effect to bars near the current position when playing
        if ((isPlaying || isBuffering) && x >= progressPixel - barWidth * 5 && x <= progressPixel + barWidth * 5) {
          const distance = Math.abs(x - progressPixel) / (barWidth * 5);
          const pulseOpacity = isBuffering ? 0.7 - (distance * 0.7) : 0.5 - (distance * 0.5);
          
          if (pulseOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
            const pulseFactor = isBuffering ? 1 + (0.3 * (1 - distance)) : 1 + (0.2 * (1 - distance));
            const pulseHeight = barHeight * pulseFactor;
            const pulseY = (height - pulseHeight) / 2;
            
            // Draw pulsing bar with rounded corners
            ctx.beginPath();
            // Top-left corner
            ctx.moveTo(x + barMargin/2 + radius, pulseY);
            // Top-right corner
            ctx.lineTo(x + barMargin/2 + effectiveBarWidth - radius, pulseY);
            ctx.quadraticCurveTo(x + barMargin/2 + effectiveBarWidth, pulseY, 
                                x + barMargin/2 + effectiveBarWidth, pulseY + radius);
            // Bottom-right corner
            ctx.lineTo(x + barMargin/2 + effectiveBarWidth, pulseY + pulseHeight - radius);
            ctx.quadraticCurveTo(x + barMargin/2 + effectiveBarWidth, pulseY + pulseHeight,
                                x + barMargin/2 + effectiveBarWidth - radius, pulseY + pulseHeight);
            // Bottom-left corner
            ctx.lineTo(x + barMargin/2 + radius, pulseY + pulseHeight);
            ctx.quadraticCurveTo(x + barMargin/2, pulseY + pulseHeight,
                                x + barMargin/2, pulseY + pulseHeight - radius);
            // Back to top-left
            ctx.lineTo(x + barMargin/2, pulseY + radius);
            ctx.quadraticCurveTo(x + barMargin/2, pulseY, 
                                x + barMargin/2 + radius, pulseY);
            
            ctx.fill();
          }
        }
      }
      
      // Only draw progress line if duration is valid
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
      className={`w-full h-full rounded-md waveform-bg ${isFinite(duration) && duration > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
      onClick={handleClick}
    />
  );
};

export default WaveformCanvas;
