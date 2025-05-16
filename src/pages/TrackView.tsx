import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TrackPlayer from "@/components/TrackPlayer";
import TrackFeedbackSection from "@/components/track/TrackFeedbackSection";
import TrackLoading from "@/components/track/TrackLoading";
import TrackNotFound from "@/components/track/TrackNotFound";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getTrack } from "@/services/trackService";
import { useAuth } from "@/context/AuthContext";
import { TrackData } from "@/types/track";
import TrackFeedbackDisplay from "@/components/track/TrackFeedbackDisplay";

const TrackView = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const loadTrack = async () => {
      if (!trackId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const track = await getTrack(trackId);
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
  }, [trackId, user]);

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
            trackId={trackId}
            trackName={displayName} 
            audioUrl={trackData.mp3_url || trackData.compressed_url}
            originalUrl={trackData.original_url}
            waveformAnalysisUrl={trackData.original_url || trackData.mp3_url || trackData.compressed_url}
            originalFilename={trackData.original_filename}
            isOwner={isOwner}
          />
          
          {isOwner ? (
            <>
              <TrackFeedbackDisplay trackId={trackId} trackTitle={displayName} />
            </>
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
