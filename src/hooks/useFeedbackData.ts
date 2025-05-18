
import { useState, useEffect } from 'react';
import { getFeedbackForTrack, Feedback } from "@/services/feedbackService";
import { supabase } from "@/integrations/supabase/client";

interface RatingsSummary {
  mixing: number;
  harmonies: number;
  melodies: number;
  soundDesign: number;
  arrangement: number;
}

interface FeedbackData {
  feedback: Feedback[];
  userDetails: Record<string, { username: string, avatarUrl?: string }>;
  averageRatings: RatingsSummary;
  djSetPercentage: number;
  listeningPercentage: number;
  isLoading: boolean;
}

const useFeedbackData = (trackId?: string) => {
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    feedback: [],
    userDetails: {},
    averageRatings: {
      mixing: 0,
      harmonies: 0,
      melodies: 0,
      soundDesign: 0,
      arrangement: 0,
    },
    djSetPercentage: 0,
    listeningPercentage: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!trackId) return;
      
      try {
        const feedbackItems = await getFeedbackForTrack(trackId);
        
        // Extract user IDs from feedback to fetch user details
        const userIds = feedbackItems
          .filter(item => !item.anonymous && item.user_id)
          .map(item => item.user_id as string);
        
        let userDetailsMap: Record<string, { username: string, avatarUrl?: string }> = {};
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);
            
          if (profiles) {
            profiles.forEach(profile => {
              userDetailsMap[profile.id] = { 
                username: profile.username || 'Anonymous User',
                avatarUrl: profile.avatar_url || undefined
              };
            });
          }
        }
        
        // Calculate averages
        let calculatedAverages = {
          mixing: 0,
          harmonies: 0,
          melodies: 0,
          soundDesign: 0,
          arrangement: 0,
        };
        
        let djYesCount = 0;
        let listenYesCount = 0;
        
        if (feedbackItems.length > 0) {
          const total = feedbackItems.length;
          const sumRatings = feedbackItems.reduce(
            (acc, item) => {
              return {
                mixing: acc.mixing + item.mixing_score,
                harmonies: acc.harmonies + item.harmonies_score,
                melodies: acc.melodies + item.melodies_score,
                soundDesign: acc.soundDesign + item.sound_design_score,
                arrangement: acc.arrangement + item.arrangement_score,
              };
            },
            { mixing: 0, harmonies: 0, melodies: 0, soundDesign: 0, arrangement: 0 }
          );
          
          calculatedAverages = {
            mixing: parseFloat((sumRatings.mixing / total).toFixed(1)),
            harmonies: parseFloat((sumRatings.harmonies / total).toFixed(1)),
            melodies: parseFloat((sumRatings.melodies / total).toFixed(1)),
            soundDesign: parseFloat((sumRatings.soundDesign / total).toFixed(1)),
            arrangement: parseFloat((sumRatings.arrangement / total).toFixed(1)),
          };
          
          djYesCount = feedbackItems.filter(item => item.dj_set_play).length;
          listenYesCount = feedbackItems.filter(item => item.casual_listening).length;
        }
        
        setFeedbackData({
          feedback: feedbackItems,
          userDetails: userDetailsMap,
          averageRatings: calculatedAverages,
          djSetPercentage: feedbackItems.length > 0 ? Math.round((djYesCount / feedbackItems.length) * 100) : 0,
          listeningPercentage: feedbackItems.length > 0 ? Math.round((listenYesCount / feedbackItems.length) * 100) : 0,
          isLoading: false,
        });
        
      } catch (error) {
        console.error("Error fetching feedback:", error);
        setFeedbackData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchFeedback();
  }, [trackId]);

  return feedbackData;
};

export default useFeedbackData;
