
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TrackPlayer from "@/components/TrackPlayer";
import TrackFeedbackSection from "@/components/track/TrackFeedbackSection";
import TrackLoading from "@/components/track/TrackLoading";
import TrackNotFound from "@/components/track/TrackNotFound";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getTrack, incrementPlayCount, getTrackIdByShareKey } from "@/services/trackService";
import { useAuth } from "@/context/AuthContext";
import { TrackData } from "@/types/track";
import TrackFeedbackDisplay from "@/components/track/TrackFeedbackDisplay";
import ShareLinkManager from "@/components/track/ShareLinkManager";

const TrackView = () => {
  const { trackId, shareKey } = useParams<{ trackId?: string; shareKey?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("feedback");

  useEffect(() => {
    const loadTrack = async () => {
      setIsLoading(true);
      
      try {
        let actualTrackId = trackId;
        
        // If we have a share key, get the track ID from it
        if (shareKey && !trackId) {
          actualTrackId = await getTrackIdByShareKey(shareKey);
          
          if (actualTrackId) {
            // Increment play count for shared link
            await incrementPlayCount(shareKey);
          }
        }

        if (!actualTrackId) {
          setTrackData(null);
          setIsLoading(false);
          return;
        }

        const track = await getTrack(actualTrackId);
        setTrackData(track);
        
        if (track && user) {
          setIsOwner(track.user_id === user.id);
        }
      } catch (error) {
        console.error("Error loading track:", error);
        setTrackData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrack();
  }, [trackId, shareKey, user]);

  if (isLoading) {
    return <TrackLoading />;
  }

  if (!trackData) {
    return <TrackNotFound />;
  }

  // Use the original filename for display - this keeps hyphens and original capitalization
  const displayName = trackData.title;

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      {/* Navigation component is now hidden */}
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center mb-4">
            <Button 
              onClick={() => navigate(-1)} 
              variant="ghost" 
              className="flex items-center gap-2 text-wip-pink hover:bg-wip-pink/10"
            >
              ← Back
            </Button>
          </div>
          
          <TrackPlayer 
            trackId={trackData.id}
            trackName={displayName} 
            audioUrl={trackData.mp3_url || trackData.compressed_url}
            originalUrl={trackData.original_url}
            waveformAnalysisUrl={trackData.original_url || trackData.mp3_url || trackData.compressed_url}
            originalFilename={trackData.original_filename}
            isOwner={isOwner}
          />
          
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
                  Share Links
                </Button>
              </div>
              
              {activeTab === "feedback" ? (
                <TrackFeedbackDisplay trackId={trackData.id} trackTitle={displayName} />
              ) : (
                <ShareLinkManager trackId={trackData.id} trackTitle={displayName} />
              )}
            </div>
          ) : (
            <TrackFeedbackSection trackTitle={displayName} user={user} />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TrackView;
