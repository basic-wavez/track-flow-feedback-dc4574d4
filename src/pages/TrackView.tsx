import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowUpCircle, History } from "lucide-react";
import TrackPlayer from "@/components/TrackPlayer";
import ProcessingIndicator from "@/components/ProcessingIndicator";
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
import { getFileTypeFromUrl, needsProcessingIndicator, isWavFormat } from "@/lib/audioUtils";

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
  
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for forcing data reload

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
  }, [params.trackId, isShareRoute, user, location.pathname, refreshKey]); // Add refreshKey to the dependency array
  
  // Handler for when processing completes
  const handleProcessingComplete = () => {
    console.log("Processing complete - refreshing track data");
    setRefreshKey(prev => prev + 1); // Increment refresh key to trigger data reload
  };

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
  
  // Determine if we need to show the processing indicator instead of the player
  const originalFileType = getFileTypeFromUrl(trackData?.original_url);
  const showProcessingIndicator = trackData ? needsProcessingIndicator(
    originalFileType,
    trackData.mp3_url,
    trackData.opus_url,
    trackData.processing_status
  ) : false;
  
  // Determine which URL to prioritize for playback
  const getPlaybackUrl = () => {
    if (!trackData) return undefined;
    
    // For WAV files, prioritize the original URL for immediate playback
    if (isWavFormat(originalFileType)) {
      return trackData.original_url;
    }
    
    // Otherwise follow the normal priority: MP3 > compressed > original
    return trackData.mp3_url || trackData.compressed_url || trackData.original_url;
  };
  
  // Get the best URL for waveform analysis
  const getWaveformUrl = () => {
    if (!trackData) return undefined;
    
    // For WAV files, we can use the original for waveform too
    if (isWavFormat(originalFileType)) {
      return trackData.original_url;
    }
    
    return trackData.mp3_url || trackData.compressed_url;
  };

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {trackData && showProcessingIndicator ? (
            <ProcessingIndicator
              trackId={trackData.id}
              trackName={trackData.title}
              status={trackData.processing_status || "pending"}
              isOwner={isOwner}
              originalFormat={originalFileType}
              onComplete={handleProcessingComplete}
            />
          ) : trackData && (
            <TrackPlayer 
              trackId={trackData.id}
              trackName={trackData.title} 
              audioUrl={getPlaybackUrl()} // Use our helper function
              originalUrl={trackData.original_url}
              waveformAnalysisUrl={getWaveformUrl()} // Use our helper function
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
              trackVersions={trackVersions} // Pass the versions to the player
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
