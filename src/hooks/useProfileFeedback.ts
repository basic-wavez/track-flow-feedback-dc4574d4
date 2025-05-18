
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrackWithVersions } from "@/types/track";

export interface FeedbackSummary {
  id: string;
  trackId: string;
  trackTitle: string;
  averageScore: number;
  feedbackCount: number;
  createdAt: Date;
}

/**
 * Hook for fetching feedback summaries with React Query
 */
export function useProfileFeedback(tracks: TrackWithVersions[]) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: ['userFeedback', user?.id, tracks.length],
    queryFn: async (): Promise<FeedbackSummary[]> => {
      if (!isAuthenticated || !user || tracks.length === 0) {
        return [];
      }

      try {
        // Get track IDs from the provided tracks
        const trackIds = tracks.map(track => track.id);
        
        // Get feedback for user's tracks
        const { data: feedbackData, error } = await supabase
          .from('feedback')
          .select(`
            id, 
            track_id,
            created_at,
            mixing_score,
            harmonies_score,
            melodies_score,
            sound_design_score,
            arrangement_score
          `)
          .in('track_id', trackIds);
          
        if (error) {
          throw error;
        }
        
        // Process feedback data to create summaries
        const feedbackByTrack = feedbackData.reduce((acc, item) => {
          const trackId = item.track_id;
          if (!acc[trackId]) {
            acc[trackId] = [];
          }
          acc[trackId].push(item);
          return acc;
        }, {} as Record<string, any[]>);
        
        // Convert to feedback summary objects
        const summaries: FeedbackSummary[] = Object.entries(feedbackByTrack).map(([trackId, feedbackItems]) => {
          // Find the track title
          const track = tracks.find(t => t.id === trackId);
          
          // Calculate average score across all dimensions
          const totalScores = feedbackItems.reduce((sum, item) => {
            return sum + (
              item.mixing_score + 
              item.harmonies_score + 
              item.melodies_score + 
              item.sound_design_score + 
              item.arrangement_score
            ) / 5; // Average of 5 dimensions
          }, 0);
          
          const averageScore = totalScores / feedbackItems.length;
          
          return {
            id: feedbackItems[0].id, // Use first feedback ID
            trackId,
            trackTitle: track?.title || "Unknown Track",
            averageScore,
            feedbackCount: feedbackItems.length,
            createdAt: new Date(feedbackItems[0].created_at)
          };
        });

        return summaries;
      } catch (error) {
        console.error("Failed to fetch feedback data:", error);
        toast({
          title: "Error Loading Feedback",
          description: "There was a problem loading your feedback data.",
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
    enabled: !!isAuthenticated && !!user && tracks.length > 0,
  });
}
