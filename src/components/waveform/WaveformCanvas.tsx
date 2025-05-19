import { useEffect, useRef, memo } from 'react';

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
  const animationFrameRef = useRef<number | null>(null);
  const prevTimeRef = useRef(currentTime);
  const prevIsPlayingRef = useRef(isPlaying);
  
  useEffect(() => {
    const drawWaveform = () => {
      const canvas = canvasRef.current;
      if (!canvas || waveformData.length === 0) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Only redraw if playing state or time has changed significantly
      if (prevIsPlayingRef.current === isPlaying && 
          Math.abs(prevTimeRef.current - currentTime) < 0.1 && 
          !isBuffering && 
          !animationFrameRef.current) {
        return;
      }
      
      // Update refs for optimization
      prevTimeRef.current = currentTime;
      prevIsPlayingRef.current = isPlaying;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear the canvas
      ctx.clearRect(0, 0, width, height);
      
      // Calculate the progress position
      const isValidDuration = isFinite(duration) && duration > 0;
      const progress = isValidDuration ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
      const progressPixel = width * progress;
      
      // Draw the waveform bars with enhanced styling
      const barWidth = width / waveformData.length;
      const barMargin = barWidth * 0.25; // Increased spacing for more distinct bars
      const effectiveBarWidth = barWidth - barMargin;
      
      // Add a subtle background glow effect
      if (isPlaying) {
        const glowGradient = ctx.createRadialGradient(
          progressPixel, height/2, 5, 
          progressPixel, height/2, height * 0.8
        );
        glowGradient.addColorStop(0, 'rgba(241, 132, 200, 0.3)');
        glowGradient.addColorStop(1, 'rgba(241, 132, 200, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, width, height);
      }
      
      // Draw each bar with enhanced styling and reduced height
      for (let i = 0; i < waveformData.length; i++) {
        const x = i * barWidth;
        
        // Use the amplitude with a power curve for more pronounced peaks
        const amplitude = Math.pow(waveformData[i], 0.9); 
        const barHeight = height * amplitude;
        const y = (height - barHeight) / 2;
        
        // Alternate slightly taller bars for visual interest
        const heightMultiplier = i % 2 === 0 ? 1 : 0.92;
        const adjustedBarHeight = barHeight * heightMultiplier;
        const adjustedY = (height - adjustedBarHeight) / 2;
        
        // Create more dynamic coloring with gradients
        let gradient;
        
        if (x < progressPixel) {
          // Enhanced gradient for played section
          gradient = ctx.createLinearGradient(0, adjustedY, 0, adjustedY + adjustedBarHeight);
          
          if (isMp3Available) {
            // Create a more vibrant pink gradient with multiple color stops
            gradient.addColorStop(0, 'rgba(255, 192, 230, 0.98)'); // Lighter pink at top
            gradient.addColorStop(0.5, 'rgba(246, 152, 210, 0.95)'); // Mid pink in middle
            gradient.addColorStop(1, 'rgba(210, 113, 181, 0.92)');  // Deeper pink at bottom
            
            // Higher amplitude bars get more vibrant colors
            if (amplitude > 0.6) {
              gradient.addColorStop(0, 'rgba(255, 200, 235, 1)'); // Even brighter for peaks
              gradient.addColorStop(1, 'rgba(235, 133, 201, 0.95)');
            }
          } else {
            // Standard gradient but still enhanced
            gradient.addColorStop(0, 'rgba(251, 182, 220, 0.98)');
            gradient.addColorStop(1, 'rgba(220, 143, 191, 0.9)');
          }
          
          ctx.fillStyle = gradient;
        } else {
          // Enhanced gradient for unplayed section - now with more depth
          gradient = ctx.createLinearGradient(0, adjustedY, 0, adjustedY + adjustedBarHeight);
          
          if (isMp3Available) {
            gradient.addColorStop(0, 'rgba(241, 172, 210, 0.5)');
            gradient.addColorStop(1, 'rgba(221, 152, 190, 0.4)');
          } else {
            gradient.addColorStop(0, 'rgba(231, 162, 200, 0.4)');
            gradient.addColorStop(1, 'rgba(201, 132, 170, 0.3)');
          }
          
          ctx.fillStyle = gradient;
        }
        
        // Draw the bar with more pronounced shape for visual impact
        // Now using a full rounded rect approach for smoother corners
        const radius = Math.min(effectiveBarWidth / 2, 3);
        
        ctx.beginPath();
        
        // Top-left corner
        ctx.moveTo(x + barMargin/2 + radius, adjustedY);
        // Top-right corner
        ctx.lineTo(x + barMargin/2 + effectiveBarWidth - radius, adjustedY);
        ctx.quadraticCurveTo(
          x + barMargin/2 + effectiveBarWidth, adjustedY, 
          x + barMargin/2 + effectiveBarWidth, adjustedY + radius
        );
        // Bottom-right corner
        ctx.lineTo(x + barMargin/2 + effectiveBarWidth, adjustedY + adjustedBarHeight - radius);
        ctx.quadraticCurveTo(
          x + barMargin/2 + effectiveBarWidth, adjustedY + adjustedBarHeight,
          x + barMargin/2 + effectiveBarWidth - radius, adjustedY + adjustedBarHeight
        );
        // Bottom-left corner
        ctx.lineTo(x + barMargin/2 + radius, adjustedY + adjustedBarHeight);
        ctx.quadraticCurveTo(
          x + barMargin/2, adjustedY + adjustedBarHeight,
          x + barMargin/2, adjustedY + adjustedBarHeight - radius
        );
        // Back to top-left
        ctx.lineTo(x + barMargin/2, adjustedY + radius);
        ctx.quadraticCurveTo(
          x + barMargin/2, adjustedY, 
          x + barMargin/2 + radius, adjustedY
        );
        
        ctx.fill();
        
        // Add an enhanced pulsing effect to bars near the current position when playing
        if ((isPlaying || isBuffering) && x >= progressPixel - barWidth * 7 && x <= progressPixel + barWidth * 7) {
          const distance = Math.abs(x - progressPixel) / (barWidth * 7);
          const pulseOpacity = isBuffering 
            ? 0.8 - (distance * 0.8) 
            : 0.7 - (distance * 0.7);
          
          if (pulseOpacity > 0) {
            // Create a more dramatic pulse effect with brighter colors
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
            
            // More pronounced pulsing - varies with time for animation
            const time = Date.now() / 1000;
            const pulseSin = Math.sin(time * 3 + i * 0.2) * 0.1 + 0.9;
            const pulseScale = isBuffering 
              ? 1 + (0.4 * (1 - distance) * pulseSin)
              : 1 + (0.3 * (1 - distance) * pulseSin);
            
            const pulseHeight = adjustedBarHeight * pulseScale;
            const pulseY = (height - pulseHeight) / 2;
            
            // Draw pulsing overlay with rounded corners
            ctx.beginPath();
            
            // Top-left corner
            ctx.moveTo(x + barMargin/2 + radius, pulseY);
            // Top-right corner
            ctx.lineTo(x + barMargin/2 + effectiveBarWidth - radius, pulseY);
            ctx.quadraticCurveTo(
              x + barMargin/2 + effectiveBarWidth, pulseY, 
              x + barMargin/2 + effectiveBarWidth, pulseY + radius
            );
            // Bottom-right corner
            ctx.lineTo(x + barMargin/2 + effectiveBarWidth, pulseY + pulseHeight - radius);
            ctx.quadraticCurveTo(
              x + barMargin/2 + effectiveBarWidth, pulseY + pulseHeight,
              x + barMargin/2 + effectiveBarWidth - radius, pulseY + pulseHeight
            );
            // Bottom-left corner
            ctx.lineTo(x + barMargin/2 + radius, pulseY + pulseHeight);
            ctx.quadraticCurveTo(
              x + barMargin/2, pulseY + pulseHeight,
              x + barMargin/2, pulseY + pulseHeight - radius
            );
            // Back to top-left
            ctx.lineTo(x + barMargin/2, pulseY + radius);
            ctx.quadraticCurveTo(
              x + barMargin/2, pulseY, 
              x + barMargin/2 + radius, pulseY
            );
            
            ctx.fill();
          }
        }
      }
      
      // Only draw progress line if duration is valid
      if (isValidDuration && progressPixel > 0) {
        // Draw a more visible playhead with glow effect
        const playheadGlow = ctx.createLinearGradient(
          progressPixel - 8, 0, 
          progressPixel + 8, 0
        );
        playheadGlow.addColorStop(0, 'rgba(255, 255, 255, 0)');
        playheadGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        playheadGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = playheadGlow;
        ctx.fillRect(progressPixel - 8, 0, 16, height);
        
        // Draw the actual playhead line
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(progressPixel - 1, 0, 2, height);
      }
      
      // Add buffering indicator with enhanced animation
      if (isBuffering) {
        const bufferingWidth = 30;
        const bufferingX = Math.min(progressPixel + 2, width - bufferingWidth);
        
        // Draw buffering animation pulse with time-based animation
        const time = Date.now() / 200;
        const pulseAlpha = 0.7 + Math.sin(time) * 0.3;
        
        // Create gradient for buffering indicator
        const bufferGradient = ctx.createLinearGradient(
          bufferingX, 0, 
          bufferingX + bufferingWidth, 0
        );
        bufferGradient.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha})`);
        bufferGradient.addColorStop(0.5, `rgba(255, 255, 255, ${pulseAlpha * 0.8})`);
        bufferGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = bufferGradient;
        ctx.fillRect(bufferingX, 0, bufferingWidth, height);
      }
    };
    
    // Draw the waveform immediately
    drawWaveform();
    
    // Set up animation if playing or buffering with performance optimization
    if (isPlaying || isBuffering) {
      const animate = () => {
        drawWaveform();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    } else if (animationFrameRef.current) {
      // Cancel animation if stopped playing
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
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

// Memoize the component to prevent unnecessary re-renders
export default memo(WaveformCanvas);
