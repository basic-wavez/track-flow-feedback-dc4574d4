
import { startPlayTracking, endPlayTracking, cancelPlayTracking } from "@/services/playCountService";

/**
 * Hook that manages play count tracking
 */
export function usePlayCounting() {
  const startTracking = (trackId: string | null, shareKey: string | null) => {
    startPlayTracking(trackId, shareKey);
  };
  
  const endTracking = async (): Promise<boolean> => {
    try {
      const incremented = await endPlayTracking();
      if (incremented) {
        console.log("Play count incremented successfully");
      }
      return incremented;
    } catch (error) {
      console.error("Error handling play count:", error);
      return false;
    }
  };
  
  const cancelTracking = () => {
    cancelPlayTracking();
  };
  
  const trackEndOfPlay = async () => {
    try {
      const incremented = await endPlayTracking();
      if (incremented) {
        console.log("Play count incremented after track finished");
      }
      return incremented;
    } catch (error) {
      console.error("Error handling play count at track end:", error);
      return false;
    }
  };
  
  return {
    startTracking,
    endTracking,
    cancelTracking,
    trackEndOfPlay
  };
}
