
import { useRef } from "react";

/**
 * Hook that manages buffering-related state and refs
 */
export function useBufferingState() {
  const bufferingTimeoutRef = useRef<number | null>(null);
  const bufferingStartTimeRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const recentlySeekRef = useRef<boolean>(false);
  const playClickTimeRef = useRef<number>(0);

  // Clear any buffering timeouts
  const clearBufferingTimeout = () => {
    if (bufferingTimeoutRef.current !== null) {
      window.clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
  };

  return {
    bufferingTimeoutRef,
    bufferingStartTimeRef,
    lastSeekTimeRef,
    recentlySeekRef,
    playClickTimeRef,
    clearBufferingTimeout
  };
}
