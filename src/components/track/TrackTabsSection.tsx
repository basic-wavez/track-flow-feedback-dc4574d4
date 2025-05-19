
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import TrackFeedbackDisplay from "@/components/track/TrackFeedbackDisplay";
import TrackFeedbackSection from "@/components/track/TrackFeedbackSection";
import ShareLinkManager from "@/components/track/ShareLinkManager";
import { User } from "@supabase/supabase-js";

interface TrackTabsSectionProps {
  trackId: string;
  trackTitle: string;
  versionNumber: number;
  isOwner: boolean;
  user: User | null;
  resolvedTrackId?: string;
}

const TrackTabsSection: React.FC<TrackTabsSectionProps> = ({
  trackId,
  trackTitle,
  versionNumber,
  isOwner,
  user,
  resolvedTrackId
}) => {
  const [activeTab, setActiveTab] = useState<string>("feedback");

  if (isOwner) {
    return (
      <div>
        <div className="flex mb-6 space-x-4 border-b">
          <Button
            variant="ghost"
            className={`pb-2 ${activeTab === "feedback" ? "border-b-2 border-wip-pink text-wip-pink" : ""}`}
            onClick={() => setActiveTab("feedback")}
          >
            Feedback
          </Button>
          <Button
            variant="ghost"
            className={`pb-2 ${activeTab === "share" ? "border-b-2 border-wip-pink text-wip-pink" : ""}`}
            onClick={() => setActiveTab("share")}
          >
            Share
          </Button>
        </div>
        
        {activeTab === "feedback" ? (
          <TrackFeedbackDisplay 
            trackId={trackId} 
            trackTitle={trackTitle} 
            trackVersion={versionNumber}
          />
        ) : (
          <ShareLinkManager trackId={trackId} trackTitle={trackTitle} />
        )}
      </div>
    );
  }
  
  return (
    <TrackFeedbackSection 
      trackTitle={trackTitle} 
      trackVersion={versionNumber}
      user={user} 
      trackId={resolvedTrackId} 
    />
  );
};

export default React.memo(TrackTabsSection);
