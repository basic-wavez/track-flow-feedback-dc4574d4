
import React from "react";
import { TrackVersion } from "@/types/track";
import TrackVersionsDrawer from "@/components/track/TrackVersionsDrawer";

interface TrackHeaderSectionProps {
  trackId: string;
  displayName: string;
  isOwner: boolean;
  trackVersions: TrackVersion[];
}

const TrackHeaderSection: React.FC<TrackHeaderSectionProps> = ({
  trackId,
  displayName,
  isOwner,
  trackVersions
}) => {
  // Now this component won't show any header content as the title is shown in the player
  return null;
};

export default React.memo(TrackHeaderSection);
