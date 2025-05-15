
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
      const barMargin = barWidth * 0.15; // Slight reduction in margin for a denser look
      const effectiveBarWidth = barWidth - barMargin;
      
      for (let i = 0; i < waveformData.length; i++) {
        const x = i * barWidth;
        const amplitude = waveformData[i] * 0.8; // Use 80% of canvas height for better visibility
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
        
        // Draw the bar with rounded corners for a smoother look
        ctx.beginPath();
        const cornerRadius = Math.min(2, effectiveBarWidth / 2);
        const barX = x + barMargin/2;
        
        // Draw rounded rectangle for the bar
        if (cornerRadius > 0 && effectiveBarWidth > 4) {
          ctx.moveTo(barX + cornerRadius, y);
          ctx.lineTo(barX + effectiveBarWidth - cornerRadius, y);
          ctx.quadraticCurveTo(barX + effectiveBarWidth, y, barX + effectiveBarWidth, y + cornerRadius);
          ctx.lineTo(barX + effectiveBarWidth, y + barHeight - cornerRadius);
          ctx.quadraticCurveTo(barX + effectiveBarWidth, y + barHeight, barX + effectiveBarWidth - cornerRadius, y + barHeight);
          ctx.lineTo(barX + cornerRadius, y + barHeight);
          ctx.quadraticCurveTo(barX, y + barHeight, barX, y + barHeight - cornerRadius);
          ctx.lineTo(barX, y + cornerRadius);
          ctx.quadraticCurveTo(barX, y, barX + cornerRadius, y);
          ctx.fill();
        } else {
          // Simple rectangle for small bars
          ctx.fillRect(barX, y, effectiveBarWidth, barHeight);
        }
        
        // Add a subtle pulsing effect to bars near the current position when playing
        if ((isPlaying || isBuffering) && x >= progressPixel - barWidth * 5 && x <= progressPixel + barWidth * 5) {
          const distance = Math.abs(x - progressPixel) / (barWidth * 5);
          const pulseOpacity = isBuffering ? 0.7 - (distance * 0.7) : 0.5 - (distance * 0.5);
          
          if (pulseOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
            const pulseFactor = isBuffering ? 1 + (0.3 * (1 - distance)) : 1 + (0.2 * (1 - distance));
            const pulseHeight = barHeight * pulseFactor;
            const pulseY = (height - pulseHeight) / 2;
            
            // Draw pulse with rounded corners if possible
            if (cornerRadius > 0 && effectiveBarWidth > 4) {
              ctx.beginPath();
              ctx.moveTo(barX + cornerRadius, pulseY);
              ctx.lineTo(barX + effectiveBarWidth - cornerRadius, pulseY);
              ctx.quadraticCurveTo(barX + effectiveBarWidth, pulseY, barX + effectiveBarWidth, pulseY + cornerRadius);
              ctx.lineTo(barX + effectiveBarWidth, pulseY + pulseHeight - cornerRadius);
              ctx.quadraticCurveTo(barX + effectiveBarWidth, pulseY + pulseHeight, barX + effectiveBarWidth - cornerRadius, pulseY + pulseHeight);
              ctx.lineTo(barX + cornerRadius, pulseY + pulseHeight);
              ctx.quadraticCurveTo(barX, pulseY + pulseHeight, barX, pulseY + pulseHeight - cornerRadius);
              ctx.lineTo(barX, pulseY + cornerRadius);
              ctx.quadraticCurveTo(barX, pulseY, barX + cornerRadius, pulseY);
              ctx.fill();
            } else {
              ctx.fillRect(barX, pulseY, effectiveBarWidth, pulseHeight);
            }
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
