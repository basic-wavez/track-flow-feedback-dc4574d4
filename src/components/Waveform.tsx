
import { useEffect, useRef } from 'react';
import { generateWaveformData } from '@/lib/audioUtils';

interface WaveformProps {
  audioUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const Waveform = ({ audioUrl, isPlaying, currentTime, duration, onSeek }: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // In a real app, we would extract actual waveform data from the audio file
  // For this demo, we'll generate random waveform data
  const waveformData = useRef(generateWaveformData(150));
  
  useEffect(() => {
    const drawWaveform = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
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
      const barWidth = width / waveformData.current.length;
      const barMargin = barWidth * 0.2;
      const effectiveBarWidth = barWidth - barMargin;
      
      for (let i = 0; i < waveformData.current.length; i++) {
        const x = i * barWidth;
        const amplitude = waveformData.current[i] * 0.7; // Reduce max height to 70% of canvas
        const barHeight = height * amplitude;
        const y = (height - barHeight) / 2;
        
        // Determine color based on playback position
        if (x < progressPixel) {
          // Gradient for played section
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(229, 98, 162, 0.9)');
          gradient.addColorStop(1, 'rgba(182, 70, 128, 0.7)');
          ctx.fillStyle = gradient;
        } else {
          // Color for unplayed section
          ctx.fillStyle = 'rgba(229, 98, 162, 0.3)';
        }
        
        // Draw the bar
        ctx.fillRect(x + barMargin/2, y, effectiveBarWidth, barHeight);
        
        // Add a subtle pulsing effect to bars near the current position when playing
        if (isPlaying && x >= progressPixel - barWidth * 5 && x <= progressPixel + barWidth * 5) {
          const distance = Math.abs(x - progressPixel) / (barWidth * 5);
          const pulseOpacity = 0.5 - (distance * 0.5);
          
          if (pulseOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
            const pulseFactor = 1 + (0.2 * (1 - distance));
            const pulseHeight = barHeight * pulseFactor;
            const pulseY = (height - pulseHeight) / 2;
            ctx.fillRect(x + barMargin/2, pulseY, effectiveBarWidth, pulseHeight);
          }
        }
      }
      
      // Draw progress line
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(progressPixel - 1, 0, 2, height);
    };
    
    // Draw the waveform
    drawWaveform();
    
    // Set up animation if playing
    let animationFrame: number;
    if (isPlaying) {
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
  }, [isPlaying, currentTime, duration]);
  
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
    </div>
  );
};

export default Waveform;
