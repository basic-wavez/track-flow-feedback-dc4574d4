
import { useRef } from "react";

/**
 * Hook that manages visibility-related state for the audio player
 */
export function useVisibilityState() {
  // Store visibility-related state
  const wasPlayingBeforeHideRef = useRef(false);
  
  return {
    wasPlayingBeforeHideRef
  };
}
