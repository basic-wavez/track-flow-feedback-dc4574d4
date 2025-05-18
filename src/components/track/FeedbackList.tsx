
import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { FeedbackSummary } from "@/hooks/useProfileFeedback";
import MobileFeedbackCard from "@/components/track/MobileFeedbackCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface FeedbackListProps {
  feedback: FeedbackSummary[];
  isLoading: boolean;
}

const FeedbackList = memo(({ feedback, isLoading }: FeedbackListProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleOpenTrack = (trackId: string) => {
    navigate(`/track/${trackId}`);
  };
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading feedback data...</p>
      </div>
    );
  }
  
  if (feedback.length === 0) {
    return (
      <div className="py-8 md:py-12 text-center border border-dashed border-wip-gray/30 rounded-md">
        <p className="text-base md:text-lg text-gray-400 mb-4">No feedback received yet</p>
        <p className="text-gray-500 mb-4">Share your tracks with other producers to get feedback</p>
      </div>
    );
  }
  
  return (
    <>
      {/* Desktop View */}
      {!isMobile && (
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Track</TableHead>
                <TableHead>Average Rating</TableHead>
                <TableHead>Feedback Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.trackTitle}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={
                        item.averageScore >= 8 ? "text-green-400" :
                        item.averageScore >= 6 ? "text-yellow-400" : 
                        "text-red-400"
                      }>
                        {item.averageScore.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">/10</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.feedbackCount} {item.feedbackCount === 1 ? 'review' : 'reviews'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenTrack(item.trackId)}
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Mobile View */}
      <div className={`${isMobile ? 'block' : 'hidden'} md:hidden`}>
        {feedback.map((item) => (
          <MobileFeedbackCard 
            key={item.id}
            feedback={item}
            onOpenTrack={handleOpenTrack}
          />
        ))}
      </div>
    </>
  );
});

FeedbackList.displayName = "FeedbackList"; // For React DevTools

export default FeedbackList;
