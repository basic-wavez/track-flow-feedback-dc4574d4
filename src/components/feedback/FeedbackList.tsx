
import React from "react";
import FeedbackItem from "./FeedbackItem";
import { Feedback } from "@/services/feedbackService";

interface FeedbackListProps {
  feedback: Feedback[];
  getUserDisplayName: (feedback: Feedback) => string;
  getUserAvatar: (feedback: Feedback) => string | undefined;
  formatDate: (dateString: string) => string;
}

const FeedbackList: React.FC<FeedbackListProps> = ({
  feedback,
  getUserDisplayName,
  getUserAvatar,
  formatDate,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold gradient-text">
        Individual Feedback
      </h2>
      
      {feedback.map((item) => (
        <FeedbackItem
          key={item.id}
          item={item}
          userDisplayName={getUserDisplayName(item)}
          avatarUrl={getUserAvatar(item)}
          createdDate={item.created_at ? formatDate(item.created_at) : ''}
        />
      ))}
    </div>
  );
};

export default React.memo(FeedbackList);
