
import { useQuery } from "@tanstack/react-query";
import { getUserTracks } from "@/services/trackService";
import { TrackWithVersions } from "@/types/track";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { VisibilityStateManager } from "@/hooks/useVisibilityChange";

/**
 * Hook for fetching user tracks with React Query for better caching and visibility handling
 */
export function useProfileTracks() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const lastFetchTimeRef = useRef<number>(Date.now());
  const visibilityChangedRef = useRef<boolean>(false);
  
  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (VisibilityStateManager.getState() === 'visible') {
        visibilityChangedRef.current = true;
      }
    };
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  // Main tracks query with React Query
  const {
    data: tracks = [],
    isLoading,
    refetch,
    error,
  } = useQuery<TrackWithVersions[]>({
    queryKey: ['userTracks', user?.id],
    queryFn: async () => {
      // Skip if not authenticated
      if (!isAuthenticated || !user) {
        return [];
      }
      
      // Keep track of fetch time to avoid rapid refetches
      lastFetchTimeRef.current = Date.now();
      
      try {
        return await getUserTracks();
      } catch (error) {
        console.error("Failed to fetch user tracks:", error);
        toast({
          title: "Error Loading Tracks",
          description: "There was a problem loading your tracks.",
          variant: "destructive",
        });
        return [];
      }
    },
    // Important options for good tab visibility behavior
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
    enabled: !!isAuthenticated && !!user,
  });

  return {
    tracks,
    isLoading,
    refetch,
    error,
  };
}
