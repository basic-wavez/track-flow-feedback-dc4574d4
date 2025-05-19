
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface FeedbackHeaderProps {
  trackId?: string;
}

const FeedbackHeader: React.FC<FeedbackHeaderProps> = ({ trackId }) => {
  const navigate = useNavigate();

  return (
    <div className="py-6 px-8 border-b border-wip-gray/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-wip-pink hover:bg-wip-pink/10"
            onClick={() => navigate(`/track/${trackId}`)}
          >
            <ChevronLeft size={16} />
            <span>Back to Track</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FeedbackHeader);
