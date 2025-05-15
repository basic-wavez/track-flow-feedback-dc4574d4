
import { useState, useEffect } from "react";
import { getFeedbackForTrack, Feedback } from "@/services/feedbackService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TrackFeedbackDisplayProps {
  trackId: string;
  trackTitle: string;
}

const TrackFeedbackDisplay = ({ trackId, trackTitle }: TrackFeedbackDisplayProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadFeedback = async () => {
      setIsLoading(true);
      const feedbackData = await getFeedbackForTrack(trackId);
      setFeedback(feedbackData);
      setIsLoading(false);
    };
    
    if (trackId) {
      loadFeedback();
    }
  }, [trackId]);
  
  const calculateAverageScore = (property: keyof Pick<Feedback, 'melodies_score' | 'arrangement_score' | 'mixing_score' | 'harmonies_score' | 'sound_design_score'>) => {
    if (feedback.length === 0) return 0;
    const sum = feedback.reduce((acc, item) => acc + item[property], 0);
    return Math.round((sum / feedback.length) * 10) / 10;
  };
  
  const getDjPlayPercentage = () => {
    if (feedback.length === 0) return 0;
    const djPlayCount = feedback.filter(item => item.dj_set_play).length;
    return Math.round((djPlayCount / feedback.length) * 100);
  };
  
  const getCasualListeningPercentage = () => {
    if (feedback.length === 0) return 0;
    const casualCount = feedback.filter(item => item.casual_listening).length;
    return Math.round((casualCount / feedback.length) * 100);
  };
  
  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  
  if (feedback.length === 0) {
    return (
      <div className="text-center p-8 mt-8">
        <p className="text-gray-400">No feedback available for this track yet.</p>
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold gradient-text">Feedback Summary ({feedback.length})</h2>
        <Button 
          variant="outline" 
          className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
          onClick={() => navigate(`/feedback/${trackId}`)}
        >
          View Detailed Feedback
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-wip-darker border-wip-gray/20">
          <CardHeader>
            <CardTitle className="text-wip-pink">Rating Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Melodies</span>
                <span className="font-semibold">{calculateAverageScore('melodies_score')}/10</span>
              </div>
              <Progress value={calculateAverageScore('melodies_score') * 10} className="h-2 bg-wip-gray/30" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Arrangement</span>
                <span className="font-semibold">{calculateAverageScore('arrangement_score')}/10</span>
              </div>
              <Progress value={calculateAverageScore('arrangement_score') * 10} className="h-2 bg-wip-gray/30" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Mixing</span>
                <span className="font-semibold">{calculateAverageScore('mixing_score')}/10</span>
              </div>
              <Progress value={calculateAverageScore('mixing_score') * 10} className="h-2 bg-wip-gray/30" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Harmonies</span>
                <span className="font-semibold">{calculateAverageScore('harmonies_score')}/10</span>
              </div>
              <Progress value={calculateAverageScore('harmonies_score') * 10} className="h-2 bg-wip-gray/30" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Sound Design</span>
                <span className="font-semibold">{calculateAverageScore('sound_design_score')}/10</span>
              </div>
              <Progress value={calculateAverageScore('sound_design_score') * 10} className="h-2 bg-wip-gray/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-wip-darker border-wip-gray/20">
          <CardHeader>
            <CardTitle className="text-wip-pink">Usage Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Would play in a DJ set</span>
                <span className="font-semibold">{getDjPlayPercentage()}%</span>
              </div>
              <Progress value={getDjPlayPercentage()} className="h-3 bg-wip-gray/30" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Would listen casually</span>
                <span className="font-semibold">{getCasualListeningPercentage()}%</span>
              </div>
              <Progress value={getCasualListeningPercentage()} className="h-3 bg-wip-gray/30" />
            </div>
            
            {feedback.length > 0 && feedback[0].written_feedback && (
              <div className="mt-4 pt-4 border-t border-wip-gray/20">
                <h3 className="text-wip-pink mb-2">Latest Comment:</h3>
                <p className="text-gray-300 italic">{feedback[0].written_feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrackFeedbackDisplay;
