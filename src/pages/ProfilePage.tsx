
import { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { deleteTrack } from "@/services/trackService";
import { Music, MessageSquare, Settings } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { TrackData } from "@/types/track";
import AccountSettings from "@/components/auth/AccountSettings";
import { useProfileTracks } from "@/hooks/useProfileTracks";
import { useProfileFeedback } from "@/hooks/useProfileFeedback";
import TrackList from "@/components/track/TrackList";
import FeedbackList from "@/components/track/FeedbackList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Using memo to prevent unnecessary re-renders
const ProfilePage = memo(() => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("tracks");
  
  // Track deletion state
  const [trackToDelete, setTrackToDelete] = useState<TrackData | null>(null);
  const [isDeletingTrack, setIsDeletingTrack] = useState(false);
  
  // Fetch tracks data with React Query
  const { 
    tracks, 
    isLoading: isTracksLoading,
    refetch: refetchTracks
  } = useProfileTracks();
  
  // Fetch feedback data with React Query (dependent on tracks)
  const {
    data: feedback = [],
    isLoading: isFeedbackLoading
  } = useProfileFeedback(tracks);
  
  // Handler for showing delete confirmation
  const handleDeletePrompt = useCallback((trackId: string, title: string) => {
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
  }, []);
  
  // Handler for track deletion
  const handleDeleteTrack = useCallback(async () => {
    if (!trackToDelete) return;
    
    setIsDeletingTrack(true);
    try {
      const success = await deleteTrack(trackToDelete.id);
      
      if (success) {
        // Show success message
        toast({
          title: "Track Deleted",
          description: `"${trackToDelete.title}" has been permanently deleted.`,
        });
        
        // Refetch tracks after deletion
        refetchTracks();
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
  }, [trackToDelete, toast, refetchTracks]);
  
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
            
            <TabsContent value="tracks">
              <Card className="bg-wip-darker border-wip-gray">
                <CardHeader>
                  <CardTitle>My Uploaded Tracks</CardTitle>
                  <CardDescription>
                    All the tracks you've uploaded to WIP Manager
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TrackList 
                    tracks={tracks}
                    isLoading={isTracksLoading}
                    onDeletePrompt={handleDeletePrompt}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="feedback">
              <Card className="bg-wip-darker border-wip-gray">
                <CardHeader>
                  <CardTitle>Feedback Received</CardTitle>
                  <CardDescription>
                    Feedback summary for your tracks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FeedbackList 
                    feedback={feedback}
                    isLoading={isFeedbackLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <AccountSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Track Delete Confirmation Dialog */}
      <AlertDialog open={!!trackToDelete} onOpenChange={(open) => !open && setTrackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{trackToDelete?.title}"? This action cannot be undone.
              <p className="mt-2 text-red-300">
                All feedback associated with this track will also be permanently deleted.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeletingTrack}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Prevent the default close behavior
                handleDeleteTrack();
              }}
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={isDeletingTrack}
            >
              {isDeletingTrack ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Track'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
});

ProfilePage.displayName = "ProfilePage"; // For React DevTools

export default ProfilePage;
