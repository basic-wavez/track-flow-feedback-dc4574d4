import React, { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrackLoading from "@/components/track/TrackLoading";
import TrackNotFound from "@/components/track/TrackNotFound";
import TrackHeaderSection from "@/components/track/TrackHeaderSection";
import TrackPlayerSection from "@/components/track/TrackPlayerSection";
import TrackTabsSection from "@/components/track/TrackTabsSection";
import { useTrackData } from "@/hooks/useTrackData";

const TrackView: React.FC = () => {
  const params = useParams<{ trackId?: string; shareKey?: string; "*"?: string }>();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get userId for dependency tracking instead of the whole user object
  const userId = user?.id;

  // Determine if we're on a share link route by checking the URL pattern
  const isShareRoute = location.pathname.startsWith('/track/share/');

  // Extract share key from URL if we're on a share route
  const shareKey = useMemo(() => {
    if (isShareRoute) {
      const pathParts = location.pathname.split('/');
      let key = pathParts[pathParts.length - 1];
      
      // In case the URL has a trailing slash
      if (key === '') {
        key = pathParts[pathParts.length - 2];
      }
      
      console.log("Extracted share key directly from URL path:", key);
      return key;
    }
    return undefined;
  }, [isShareRoute, location.pathname]);

  const {
    trackData,
    isLoading,
    isOwner,
    error,
    currentShareKey,
    resolvedTrackId,
    trackVersions,
    refreshTrackData
  } = useTrackData({
    trackId: params.trackId,
    shareKey,
    isShareRoute,
    userId
  });

  // Handler for when processing completes
  const handleProcessingComplete = () => {
    console.log("Processing complete - refreshing track data");
    refreshTrackData();
  };

  if (isLoading) {
    return <TrackLoading />;
  }

  if (!trackData) {
    return <TrackNotFound error={error} />;
  }

  // Use the original filename for display - this keeps hyphens and original capitalization
  const displayName = trackData.title;
  const versionNumber = trackData.version_number || 1;

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* We keep the HeaderSection component to maintain the structure,
              but it won't display anything visible */}
          <TrackHeaderSection 
            trackId={trackData.id}
            displayName={displayName}
            isOwner={isOwner}
            trackVersions={trackVersions}
          />
          
          <TrackPlayerSection
            trackData={trackData}
            currentShareKey={currentShareKey}
            isOwner={isOwner}
            onProcessingComplete={handleProcessingComplete}
            trackVersions={trackVersions}
          />
          
          <TrackTabsSection
            trackId={trackData.id}
            trackTitle={displayName}
            versionNumber={versionNumber}
            isOwner={isOwner}
            user={user}
            resolvedTrackId={resolvedTrackId}
          />
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Export with React.memo to prevent unnecessary re-renders from parent components
export default React.memo(TrackView);
