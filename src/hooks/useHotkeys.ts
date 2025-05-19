
import { useEffect } from 'react';

interface HotkeysOptions {
  isEnabled?: boolean;
  onPlayPause?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  seekDistance?: number; // In seconds
  targetElement?: HTMLElement | null; // Element to listen on (defaults to document)
}

export function useHotkeys({
  isEnabled = true,
  onPlayPause,
  onSeekForward,
  onSeekBackward,
  seekDistance = 5,
  targetElement = null,
}: HotkeysOptions) {
  useEffect(() => {
    if (!isEnabled) return;
    
    // Default to document if no target element is provided
    const target = targetElement || document;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore hotkeys when user is typing in an input element
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as Element).tagName)) {
        return;
      }
      
      // Space = play/pause
      if (event.code === 'Space' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        if (onPlayPause) {
          event.preventDefault(); // Prevent scrolling
          onPlayPause();
        }
      }
      
      // Right Arrow = seek forward
      else if (event.code === 'ArrowRight' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        if (onSeekForward) {
          event.preventDefault();
          onSeekForward();
        }
      }
      
      // Left Arrow = seek backward
      else if (event.code === 'ArrowLeft' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        if (onSeekBackward) {
          event.preventDefault();
          onSeekBackward();
        }
      }
    };
    
    // Add event listener
    target.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, onPlayPause, onSeekForward, onSeekBackward, seekDistance, targetElement]);
}

export default useHotkeys;
