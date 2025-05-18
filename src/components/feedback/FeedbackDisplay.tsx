
import FeedbackSummaryCard from "./FeedbackSummaryCard";
import FeedbackItemCard from "./FeedbackItemCard";
import EmptyFeedback from "./EmptyFeedback";
import { Feedback } from "@/services/feedbackService";

interface FeedbackDisplayProps {
  feedback: Feedback[];
  userDetails: Record<string, { username: string, avatarUrl?: string }>;
  averageRatings: {
    mixing: number;
    harmonies: number;
    melodies: number;
    soundDesign: number;
    arrangement: number;
  };
  djSetPercentage: number;
  listeningPercentage: number;
}

const FeedbackDisplay = ({
  feedback,
  userDetails,
  averageRatings,
  djSetPercentage,
  listeningPercentage,
}: FeedbackDisplayProps) => {
  if (feedback.length === 0) {
    return <EmptyFeedback />;
  }

  return (
    <>
      <FeedbackSummaryCard
        averageRatings={averageRatings}
        djSetPercentage={djSetPercentage}
        listeningPercentage={listeningPercentage}
        feedbackCount={feedback.length}
      />
      
      <div className="space-y-6">
        <h2 className="text-2xl font-bold gradient-text">Individual Feedback</h2>
        
        {feedback.map((item) => (
          <FeedbackItemCard 
            key={item.id} 
            item={item} 
            userDetails={userDetails} 
          />
        ))}
      </div>
    </>
  );
};

export default FeedbackDisplay;
