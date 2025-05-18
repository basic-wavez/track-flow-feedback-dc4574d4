
import { useState, useRef, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import TrackLoading from "@/components/track/TrackLoading";
import TrackNotFound from "@/components/track/TrackNotFound";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import TrackResolver from "@/components/track/TrackResolver";
import TrackContent from "@/components/track/TrackContent";
import { useTrackData } from "@/hooks/useTrackData";
import { useVisibilityChange } from "@/hooks/useVisibilityChange";

const TrackView = () => {
  const params = useParams<{ trackId?: string; shareKey?: string; "*"?: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [currentShareKey, setCurrentShareKey] = useState<string | undefined>(undefined);
  const [resolvedTrackId, setResolvedTrackId] = useState<string | undefined>(params.trackId);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use visibility change hook
  const { isVisibilityChange } = useVisibilityChange();
  const isVisibilityChangeRef = useRef(isVisibilityChange);
  
  // Update ref when visibility changes
  isVisibilityChangeRef.current = isVisibilityChange;

  // Determine if we're on a share link route by checking the URL pattern
  const isShareRoute = location.pathname.startsWith('/track/share/');
  
  // Extract share key from URL if needed
  const extractShareKey = useCallback(() => {
    if (isShareRoute) {
      const pathParts = location.pathname.split('/');
      let shareKey = pathParts[pathParts.length - 1];
      
      // In case the URL has a trailing slash
      if (shareKey === '') {
        shareKey = pathParts[pathParts.length - 2];
      }
      
      console.log("Extracted share key directly from URL path:", shareKey);
      return shareKey;
    }
    return params.shareKey;
  }, [isShareRoute, location.pathname, params.shareKey]);
  
  // Handler for track resolution
  const handleTrackResolved = useCallback((trackId: string | null, trackError: string | null, shareKey?: string) => {
    if (trackId) {
      setResolvedTrackId(trackId);
      setError(null);
    } else if (trackError) {
      setError(trackError);
      setResolvedTrackId(undefined);
    }
    
    if (shareKey) {
      setCurrentShareKey(shareKey);
    }
  }, []);
  
  // Use the hook to load track data
  const { trackData, isLoading, isOwner, error: dataError, trackVersions, refreshTrack } = useTrackData(resolvedTrackId);
  
  // Handler for when processing completes
  const handleProcessingComplete = () => {
    console.log("Processing complete - refreshing track data");
    setRefreshKey(prev => prev + 1); // Increment refresh key to trigger data reload
    refreshTrack();
  };

  // Combined error from resolution and data loading
  const combinedError = error || dataError;

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4">
        {/* Track resolver component - handles share key resolution */}
        <TrackResolver 
          trackId={params.trackId} 
          shareKey={extractShareKey()} 
          isShareRoute={isShareRoute}
          onResolve={handleTrackResolved}
        />
        
        {isLoading ? (
          <TrackLoading />
        ) : !trackData ? (
          <TrackNotFound error={combinedError} />
        ) : (
          <TrackContent
            trackData={trackData}
            isOwner={isOwner}
            shareKey={currentShareKey}
            user={user}
            resolvedTrackId={resolvedTrackId}
            trackVersions={trackVersions}
            onProcessingComplete={handleProcessingComplete}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default TrackView;
