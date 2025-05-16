
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeedbackSummary {
  id: string;
  trackId: string;
  trackTitle: string;
  averageScore: number;
  feedbackCount: number;
  createdAt: Date;
}

interface MobileFeedbackCardProps {
  feedback: FeedbackSummary;
  onOpenTrack: (trackId: string) => void;
}

const MobileFeedbackCard = ({ feedback, onOpenTrack }: MobileFeedbackCardProps) => {
  return (
    <div className="p-4 border border-wip-gray/30 rounded-md mb-3 bg-wip-darker">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium line-clamp-2">{feedback.trackTitle}</h3>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Score:</span>
          <span className={
            feedback.averageScore >= 8 ? "text-green-400" :
            feedback.averageScore >= 6 ? "text-yellow-400" : 
            "text-red-400"
          }>
            {feedback.averageScore.toFixed(1)}
            <span className="text-xs text-gray-500 ml-1">/10</span>
          </span>
        </div>
        
        <Badge variant="outline">
          {feedback.feedbackCount} {feedback.feedbackCount === 1 ? 'review' : 'reviews'}
        </Badge>
      </div>
      
      <Button 
        variant="outline" 
        size="sm"
        className="w-full"
        onClick={() => onOpenTrack(feedback.trackId)}
      >
        Open Track
      </Button>
    </div>
  );
};

export default MobileFeedbackCard;
