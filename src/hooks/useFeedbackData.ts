
import { useState, useEffect } from "react";
import { getFeedbackForTrack, Feedback } from "@/services/feedbackService";
import { supabase } from "@/integrations/supabase/client";

export interface AverageRatings {
  mixing: number;
  harmonies: number;
  melodies: number;
  soundDesign: number;
  arrangement: number;
}

export interface FeedbackUserDetails {
  [userId: string]: {
    username: string;
    avatarUrl?: string;
  };
}

export function useFeedbackData(trackId?: string) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [userDetails, setUserDetails] = useState<FeedbackUserDetails>({});
  const [averageRatings, setAverageRatings] = useState<AverageRatings>({
    mixing: 0,
    harmonies: 0,
    melodies: 0,
    soundDesign: 0,
    arrangement: 0,
  });
  const [djSetPercentage, setDjSetPercentage] = useState(0);
  const [listeningPercentage, setListeningPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!trackId) return;
      
      setIsLoading(true);
      try {
        const feedbackData = await getFeedbackForTrack(trackId);
        setFeedback(feedbackData);
        
        // Extract user IDs from feedback to fetch user details
        const userIds = feedbackData
          .filter(item => !item.anonymous && item.user_id)
          .map(item => item.user_id as string);
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);
            
          if (profiles) {
            const userMap: FeedbackUserDetails = {};
            profiles.forEach(profile => {
              userMap[profile.id] = { 
                username: profile.username || 'Anonymous User',
                avatarUrl: profile.avatar_url || undefined
              };
            });
            setUserDetails(userMap);
          }
        }
        
        // Calculate average ratings
        calculateAverageRatings(feedbackData);
        
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [trackId]);

  const calculateAverageRatings = (feedbackData: Feedback[]) => {
    if (feedbackData.length === 0) return;
    
    const total = feedbackData.length;
    const sumRatings = feedbackData.reduce(
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
    
    setAverageRatings({
      mixing: parseFloat((sumRatings.mixing / total).toFixed(1)),
      harmonies: parseFloat((sumRatings.harmonies / total).toFixed(1)),
      melodies: parseFloat((sumRatings.melodies / total).toFixed(1)),
      soundDesign: parseFloat((sumRatings.soundDesign / total).toFixed(1)),
      arrangement: parseFloat((sumRatings.arrangement / total).toFixed(1)),
    });
    
    const djYesCount = feedbackData.filter(item => item.dj_set_play).length;
    const listenYesCount = feedbackData.filter(item => item.casual_listening).length;
    
    setDjSetPercentage(Math.round((djYesCount / total) * 100));
    setListeningPercentage(Math.round((listenYesCount / total) * 100));
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getUserDisplayName = (feedbackItem: Feedback) => {
    if (feedbackItem.anonymous) return "Anonymous";
    if (feedbackItem.guest_name) return feedbackItem.guest_name;
    if (feedbackItem.user_id && userDetails[feedbackItem.user_id]) {
      return userDetails[feedbackItem.user_id].username;
    }
    return "Unknown User";
  };
  
  const getUserAvatar = (feedbackItem: Feedback) => {
    if (feedbackItem.user_id && userDetails[feedbackItem.user_id]) {
      return userDetails[feedbackItem.user_id].avatarUrl;
    }
    return undefined;
  };

  return {
    feedback,
    userDetails,
    averageRatings,
    djSetPercentage,
    listeningPercentage,
    isLoading,
    formatDate,
    getUserDisplayName,
    getUserAvatar
  };
}
