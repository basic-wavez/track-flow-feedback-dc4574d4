import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getUserTracks, deleteTrack } from "@/services/trackService";
import { Music, MessageSquare, Settings, ListMusic } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { TrackData, TrackWithVersions } from "@/types/track";
import { supabase } from "@/integrations/supabase/client";
import AccountSettings from "@/components/auth/AccountSettings";
import { usePlaylists } from "@/hooks/usePlaylists";
import { FeedbackSummary } from "@/types/feedback";

// Import refactored components
import TracksTab from "@/components/profile/TracksTab";
import FeedbackTab from "@/components/profile/FeedbackTab";
import PlaylistsTab from "@/components/profile/PlaylistsTab";
import DeleteTrackDialog from "@/components/profile/DeleteTrackDialog";
import DeletePlaylistDialog from "@/components/profile/DeletePlaylistDialog";

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<TrackWithVersions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackSummary[]>([]);
  const [activeTab, setActiveTab] = useState("tracks");
  
  // Get playlists using the usePlaylists hook - Keep this for backend functionality
  const { 
    playlists, 
    isLoadingPlaylists, 
    refetchPlaylists, 
    deletePlaylist 
  } = usePlaylists();
  
  // State for playlist deletion - Keep this for backend functionality
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  
  // State for track deletion
  const [trackToDelete, setTrackToDelete] = useState<TrackData | null>(null);
  const [isDeletingTrack, setIsDeletingTrack] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch user tracks with version grouping
        const userTracks = await getUserTracks();
        setTracks(userTracks);
        
        // Fetch feedback summaries for user's tracks
        if (userTracks.length > 0) {
          const trackIds = userTracks.map(track => track.id);
          
          // Get feedback for user's tracks
          const { data: feedbackData, error } = await supabase
            .from('feedback')
            .select(`
              id, 
              track_id,
              created_at,
              mixing_score,
              harmonies_score,
              melodies_score,
              sound_design_score,
              arrangement_score
            `)
            .in('track_id', trackIds);
            
          if (error) {
            throw error;
          }
          
          // Process feedback data to create summaries
          const feedbackByTrack = feedbackData.reduce((acc, item) => {
            const trackId = item.track_id;
            if (!acc[trackId]) {
              acc[trackId] = [];
            }
            acc[trackId].push(item);
            return acc;
          }, {} as Record<string, any[]>);
          
          // Convert to feedback summary objects
          const summaries: FeedbackSummary[] = Object.entries(feedbackByTrack).map(([trackId, feedbackItems]) => {
            // Find the track title
            const track = userTracks.find(t => t.id === trackId);
            
            // Calculate average score across all dimensions
            const totalScores = feedbackItems.reduce((sum, item) => {
              return sum + (
                item.mixing_score + 
                item.harmonies_score + 
                item.melodies_score + 
                item.sound_design_score + 
                item.arrangement_score
              ) / 5; // Average of 5 dimensions
            }, 0);
            
            const averageScore = totalScores / feedbackItems.length;
            
            return {
              id: feedbackItems[0].id, // Use first feedback ID
              trackId,
              trackTitle: track?.title || "Unknown Track",
              averageScore,
              feedbackCount: feedbackItems.length,
              createdAt: new Date(feedbackItems[0].created_at)
            };
          });
          
          setFeedback(summaries);
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        toast({
          title: "Error Loading Data",
          description: "There was a problem loading your profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchUserData();
    }
  }, [user, toast]);
  
  const handleShareTrack = (trackId: string) => {
    const shareUrl = `${window.location.origin}/track/${trackId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Track link copied to clipboard!",
        });
      })
      .catch(err => {
        console.error("Could not copy link:", err);
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard.",
          variant: "destructive",
        });
      });
  };
  
  // Handler for showing delete confirmation
  const handleDeletePrompt = (trackId: string, title: string) => {
    // Create a valid TrackData object by adding required fields
    const trackData: TrackData = {
      id: trackId,
      title: title,
      original_filename: "", // We don't need this for deletion
      compressed_url: "",
      user_id: "",
      version_number: 1,
      is_latest_version: true
    };
    setTrackToDelete(trackData);
  };
  
  // Function to handle track deletion
  const handleDeleteTrack = async () => {
    if (!trackToDelete) return;
    
    setIsDeletingTrack(true);
    try {
      const success = await deleteTrack(trackToDelete.id);
      
      if (success) {
        // Remove the track from local state
        setTracks(tracks.filter(track => track.id !== trackToDelete.id));
        
        // Show success message
        toast({
          title: "Track Deleted",
          description: `"${trackToDelete.title}" has been permanently deleted.`,
        });
      } else {
        // Show error message
        toast({
          title: "Deletion Failed",
          description: "There was a problem deleting your track. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during track deletion:", error);
      toast({
        title: "Deletion Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTrack(false);
      setTrackToDelete(null); // Close dialog
    }
  };

  // Handle playlist deletion - Keep for backend functionality
  const handleDeletePlaylist = async () => {
    if (playlistToDelete) {
      try {
        await deletePlaylist(playlistToDelete);
        setPlaylistToDelete(null);
        toast({
          title: "Playlist deleted",
          description: "Your playlist has been deleted successfully."
        });
      } catch (error) {
        console.error("Error deleting playlist:", error);
        toast({
          title: "Error",
          description: "Failed to delete playlist.",
          variant: "destructive"
        });
      }
    }
  };

  const openDeletePlaylistDialog = (playlistId: string) => {
    setPlaylistToDelete(playlistId);
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                You need to be signed in to view your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 py-6 md:py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">My Profile</h1>
            <p className="text-gray-400 mt-2 break-words">
              {user.email}
            </p>
          </div>
          
          <Tabs 
            defaultValue="tracks" 
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-6 w-full md:w-auto flex overflow-x-auto no-scrollbar">
              <TabsTrigger value="tracks" className="flex gap-2 items-center flex-1 md:flex-none">
                <Music className="h-4 w-4" />
                <span>My Tracks</span>
                <Badge variant="outline" className="ml-1">
                  {tracks.length}
                </Badge>
              </TabsTrigger>
              
              <TabsTrigger value="playlists" className="flex gap-2 items-center flex-1 md:flex-none">
                <ListMusic className="h-4 w-4" />
                <span>My Playlists</span>
                <Badge variant="outline" className="ml-1">
                  {playlists.length}
                </Badge>
              </TabsTrigger>
              
              <TabsTrigger value="feedback" className="flex gap-2 items-center flex-1 md:flex-none">
                <MessageSquare className="h-4 w-4" />
                <span>Track Feedback</span>
                <Badge variant="outline" className="ml-1">
                  {feedback.length}
                </Badge>
              </TabsTrigger>
              
              <TabsTrigger value="account" className="flex gap-2 items-center flex-1 md:flex-none">
                <Settings className="h-4 w-4" />
                <span>Account</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Tracks Tab */}
            <TabsContent value="tracks">
              <TracksTab 
                tracks={tracks}
                isLoading={isLoading}
                handleShareTrack={handleShareTrack}
                handleDeletePrompt={handleDeletePrompt}
              />
            </TabsContent>
            
            {/* Playlists Tab */}
            <TabsContent value="playlists">
              <PlaylistsTab 
                playlists={playlists}
                isLoadingPlaylists={isLoadingPlaylists}
                refetchPlaylists={refetchPlaylists}
                openDeletePlaylistDialog={openDeletePlaylistDialog}
              />
            </TabsContent>
            
            {/* Feedback Tab */}
            <TabsContent value="feedback">
              <FeedbackTab 
                feedback={feedback}
                isLoading={isLoading}
              />
            </TabsContent>
            
            {/* Account Tab */}
            <TabsContent value="account">
              <AccountSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Track Delete Confirmation Dialog */}
      <DeleteTrackDialog 
        trackToDelete={trackToDelete}
        isDeletingTrack={isDeletingTrack}
        onClose={() => setTrackToDelete(null)}
        onDelete={handleDeleteTrack}
      />
      
      {/* Playlist Delete Confirmation Dialog */}
      <DeletePlaylistDialog
        playlistId={playlistToDelete}
        onClose={() => setPlaylistToDelete(null)}
        onDelete={handleDeletePlaylist}
      />
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
