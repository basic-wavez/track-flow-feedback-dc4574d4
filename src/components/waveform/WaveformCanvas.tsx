
import React, { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  waveformData: number[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isBuffering?: boolean;
  isMp3Available?: boolean;
  onSeek: (time: number) => void;
  usedPrecomputedPeaks?: boolean; // New prop to track if we're using pre-computed peaks
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  waveformData,
  currentTime,
  duration,
  isPlaying,
  isBuffering = false,
  isMp3Available = false,
  onSeek,
  usedPrecomputedPeaks = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const isMouseDown = useRef(false);

  // Draw the waveform
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on container
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Set background color
    ctx.fillStyle = '#18181b'; // Tailwind zinc-900
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate the current position marker
    const playPosition = duration > 0 ? (currentTime / duration) * canvasWidth : 0;

    // Configure bar drawing
    const barWidth = canvasWidth / waveformData.length;
    const barSpacing = Math.max(1, canvasWidth > 800 ? 2 : 1);
    const effectiveBarWidth = Math.max(1, barWidth - barSpacing);
    
    // Select colors based on source
    const unplayedColor = usedPrecomputedPeaks 
      ? '#4c1d95' // Purple for pre-computed peaks (more vibrant)
      : '#3f3f46'; // Gray for analyzed/fallback data
    
    const playedColor = usedPrecomputedPeaks
      ? '#8b5cf6' // Brighter purple for pre-computed peaks
      : '#a1a1aa'; // Light gray for analyzed/fallback data

    // Draw the bars
    for (let i = 0; i < waveformData.length; i++) {
      const x = i * barWidth;
      const barHeight = Math.max(4, waveformData[i] * canvasHeight);
      
      // Center the bar vertically
      const y = (canvasHeight - barHeight) / 2;
      
      // Choose color based on whether it's been played or not
      ctx.fillStyle = x < playPosition ? playedColor : unplayedColor;
      
      // Draw the actual bar
      ctx.fillRect(x, y, effectiveBarWidth, barHeight);
    }

    // Draw the current position marker
    if (playPosition > 0) {
      ctx.fillStyle = '#f43f5e'; // Tailwind rose-500
      ctx.fillRect(playPosition, 0, 2, canvasHeight);
    }
    
    // Clean up on component unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [waveformData, currentTime, duration, isPlaying, isBuffering, usedPrecomputedPeaks]);

  // Handle click/drag to seek
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown.current = true;
      handleSeek(e);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDown.current) {
        handleSeek(e);
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handleSeek = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const seekTime = (x / rect.width) * duration;
      onSeek(seekTime);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleSeek(e.touches[0] as unknown as MouseEvent);
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleSeek(e.touches[0] as unknown as MouseEvent);
    });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', (e) => e.preventDefault());
      canvas.removeEventListener('touchmove', (e) => e.preventDefault());
    };
  }, [onSeek, duration]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cursor-pointer relative"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ 
          filter: isBuffering ? 'brightness(0.7)' : 'none',
          transition: 'filter 0.3s ease'
        }}
      />
    </div>
  );
};

export default WaveformCanvas;
