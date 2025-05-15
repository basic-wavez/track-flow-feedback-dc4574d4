import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
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

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <div className="py-6 px-8 border-b border-wip-gray/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => navigate(-1)} 
              variant="ghost" 
              className="flex items-center gap-2 text-wip-pink hover:bg-wip-pink/10"
            >
              ← Back
            </Button>
            
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Button 
                    variant="ghost"
                    className={navigationMenuTriggerStyle()}
                    onClick={() => navigate("/")}
                  >
                    Home
                  </Button>
                </NavigationMenuItem>
                {user && (
                  <NavigationMenuItem>
                    <Button 
                      variant="ghost"
                      className={navigationMenuTriggerStyle()}
                      onClick={() => navigate("/profile")}
                    >
                      My Profile
                    </Button>
                  </NavigationMenuItem>
                )}
                {trackId && (
                  <NavigationMenuItem>
                    <Button 
                      variant="ghost"
                      className={navigationMenuTriggerStyle()}
                      onClick={() => navigate(`/feedback/${trackId}`)}
                    >
                      View Feedback
                    </Button>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </div>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <TrackPlayer 
            trackId={trackId}
            trackName={trackData.title} 
            audioUrl={trackData.mp3_url || trackData.compressed_url}
            originalUrl={trackData.original_url}
            originalFilename={trackData.original_filename}
            isOwner={isOwner}
          />
          
          {isOwner ? (
            <>
              <TrackFeedbackDisplay trackId={trackId} trackTitle={trackData.title} />
            </>
          ) : (
            <TrackFeedbackSection trackTitle={trackData.title} user={user} />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TrackView;
