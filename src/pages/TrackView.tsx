import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, History } from "lucide-react"; // Added proper import for icons
import TrackPlayer from "@/components/TrackPlayer";
import TrackFeedbackSection from "@/components/track/TrackFeedbackSection";
import TrackLoading from "@/components/track/TrackLoading";
import TrackNotFound from "@/components/track/TrackNotFound";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getTrack, getTrackVersions } from "@/services/trackQueryService";
import { getTrackIdByShareKey } from "@/services/trackShareService";
import { useAuth } from "@/context/AuthContext";
import { TrackData, TrackVersion } from "@/types/track";
import TrackFeedbackDisplay from "@/components/track/TrackFeedbackDisplay";
import ShareLinkManager from "@/components/track/ShareLinkManager";
import { isInCooldownPeriod } from "@/services/playCountService";
import TrackVersionsDrawer from "@/components/track/TrackVersionsDrawer";
import VersionControls from "@/components/track/VersionControls";

const TrackView = () => {
  const params = useParams<{ trackId?: string; shareKey?: string; "*"?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("feedback");
  const [error, setError] = useState<string | null>(null);
  const [currentShareKey, setCurrentShareKey] = useState<string | undefined>(undefined);
  const [resolvedTrackId, setResolvedTrackId] = useState<string | undefined>(params.trackId);
  const [trackVersions, setTrackVersions] = useState<TrackVersion[]>([]);

  // Determine if we're on a share link route by checking the URL pattern
  const isShareRoute = location.pathname.startsWith('/track/share/');

  useEffect(() => {
    const loadTrack = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Extract parameters based on route type
        let trackId = params.trackId;
        let shareKey: string | undefined;
        
        // For share routes, extract the share key from the URL pathname
        if (isShareRoute) {
          const pathParts = location.pathname.split('/');
          shareKey = pathParts[pathParts.length - 1];
          
          // In case the URL has a trailing slash
          if (shareKey === '') {
            shareKey = pathParts[pathParts.length - 2];
          }
          
          console.log("Extracted share key directly from URL path:", shareKey);
          
          // Important: Set share key in state INSIDE useEffect, not during render
          setCurrentShareKey(shareKey);
        }
        
        console.log("TrackView loading with params:", { trackId, shareKey, isShareRoute });
        let actualTrackId = trackId;
        
        // If we're on a share route, get the track ID from the share key
        if (isShareRoute && shareKey) {
          console.log("Loading track by share key:", shareKey);
          actualTrackId = await getTrackIdByShareKey(shareKey);
          console.log("Resolved trackId from shareKey:", actualTrackId);
          
          if (!actualTrackId) {
            console.error("No track ID found for share key:", shareKey);
            setError(`Invalid share link: ${shareKey}`);
            setTrackData(null);
            setIsLoading(false);
            return;
          }
        }

        if (!actualTrackId) {
          console.error("No track ID available after processing parameters");
          setError("Invalid track ID");
          setTrackData(null);
          setIsLoading(false);
          return;
        }

        // Store the resolved track ID in state for use throughout the component
        setResolvedTrackId(actualTrackId);

        console.log("Fetching track data for ID:", actualTrackId);
        const track = await getTrack(actualTrackId);
        
        if (!track) {
          console.error("Track not found for ID:", actualTrackId);
          setError("Track not found");
          setTrackData(null);
          setIsLoading(false);
          return;
        }
        
        console.log("Track data loaded:", track.id);
        setTrackData(track);
        
        if (track && user) {
          setIsOwner(track.user_id === user.id);
        }
        
        // Load track versions using our improved function
        if (track) {
          console.log("Loading versions for track:", track.id);
          const versions = await getTrackVersions(track.id);
          console.log("Loaded versions:", versions.length, versions.map(v => ({ id: v.id, version: v.version_number })));
          
          // Convert TrackData[] to TrackVersion[]
          const versionsArray: TrackVersion[] = versions.map(v => ({
            id: v.id,
            version_number: v.version_number,
            version_notes: v.version_notes,
            is_latest_version: v.is_latest_version,
            created_at: v.created_at
          }));
          
          setTrackVersions(versionsArray);
        }
      } catch (error) {
        console.error("Error loading track:", error);
        setTrackData(null);
        setError("Error loading track");
      } finally {
        setIsLoading(false);
      }
    };

    loadTrack();
  }, [params.trackId, isShareRoute, user, location.pathname]);

  // Check if share key is in cooldown period
  const inCooldownPeriod = currentShareKey ? isInCooldownPeriod(currentShareKey) : false;

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
          
          {/* Version controls with version drawer integration */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold gradient-text">{displayName}</h1>
            </div>
            
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-2 items-center"
                  onClick={() => navigate(`/track/${trackData.id}/version`)}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  New Version
                </Button>
                
                <TrackVersionsDrawer
                  trackId={trackData.id}
                  trackTitle={displayName}
                  versions={trackVersions}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex gap-2 items-center"
                  >
                    <History className="h-4 w-4" />
                    Version History
                  </Button>
                </TrackVersionsDrawer>
              </div>
            )}
          </div>
          
          {trackData && (
            <TrackPlayer 
              trackId={trackData.id}
              trackName={trackData.title} 
              audioUrl={trackData.mp3_url || trackData.compressed_url}
              originalUrl={trackData.original_url}
              waveformAnalysisUrl={trackData.mp3_url || trackData.compressed_url}
              originalFilename={trackData.original_filename}
              isOwner={isOwner}
              mp3Url={trackData.mp3_url}
              opusUrl={trackData.opus_url}
              opusProcessingStatus={trackData.opus_processing_status}
              shareKey={currentShareKey}
              inCooldownPeriod={inCooldownPeriod}
              processingStatus={trackData.processing_status}
              downloadsEnabled={trackData.downloads_enabled || false}
              versionNumber={versionNumber}
            />
          )}
          
          {isOwner ? (
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
              
              {trackData && activeTab === "feedback" ? (
                <TrackFeedbackDisplay 
                  trackId={trackData.id} 
                  trackTitle={trackData.title} 
                  trackVersion={versionNumber}
                />
              ) : trackData && (
                <ShareLinkManager trackId={trackData.id} trackTitle={trackData.title} />
              )}
            </div>
          ) : (
            trackData && <TrackFeedbackSection 
              trackTitle={trackData.title} 
              trackVersion={versionNumber}
              user={user} 
              trackId={resolvedTrackId} 
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TrackView;
