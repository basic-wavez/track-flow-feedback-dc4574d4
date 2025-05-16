
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getUserTracks, deleteTrack } from "@/services/trackService";
import { formatDistanceToNow } from "date-fns";
import { 
  Clock, 
  ExternalLink, 
  Share2, 
  Music, 
  MessageSquare, 
  Settings, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  History,
  FilePlus 
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { TrackData, TrackWithVersions } from "@/types/track";
import { supabase } from "@/integrations/supabase/client";
import AccountSettings from "@/components/auth/AccountSettings";
import TrackVersionsDrawer from "@/components/track/TrackVersionsDrawer";
import MobileTrackCard from "@/components/track/MobileTrackCard";
import MobileFeedbackCard from "@/components/track/MobileFeedbackCard";
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

interface FeedbackSummary {
  id: string;
  trackId: string;
  trackTitle: string;
  averageScore: number;
  feedbackCount: number;
  createdAt: Date;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [tracks, setTracks] = useState<TrackWithVersions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackSummary[]>([]);
  const [activeTab, setActiveTab] = useState("tracks");
  
  // New state for track deletion
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
  
  const handleOpenTrack = (trackId: string) => {
    navigate(`/track/${trackId}`);
  };
  
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
  
  // New function to handle track deletion
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

  // Toggle showing versions for a track
  const toggleTrackVersions = (trackId: string) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, showVersions: !track.showVersions } 
        : track
    ));
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
                  {isLoading ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading your tracks...</p>
                    </div>
                  ) : tracks.length > 0 ? (
                    <>
                      {/* Desktop View */}
                      {!isMobile && (
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead>Feedback</TableHead>
                                <TableHead>Versions</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tracks.map((track) => (
                                <TableRow key={track.id} className={track.versions.length > 1 ? "border-b-0" : ""}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center">
                                      {track.title}
                                      {track.versions.length > 1 && (
                                        <Badge variant="outline" className="ml-2">
                                          {track.versions.length} versions
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDistanceToNow(new Date(track.created_at || ""), { addSuffix: true })}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {track.feedbackCount} {track.feedbackCount === 1 ? 'review' : 'reviews'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {track.versions.length > 1 ? (
                                      <TrackVersionsDrawer 
                                        trackId={track.id}
                                        trackTitle={track.title}
                                        versions={track.versions}
                                      >
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="flex items-center gap-1"
                                        >
                                          <History className="h-3.5 w-3.5" />
                                          View All
                                        </Button>
                                      </TrackVersionsDrawer>
                                    ) : (
                                      <Badge variant="outline">v{track.versions[0]?.version_number || 1}</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm"
                                        variant="outline"
                                        className="flex gap-2 items-center"
                                        onClick={() => handleOpenTrack(track.versions.find(v => v.is_latest_version)?.id || track.id)}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        Open
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="flex gap-2 items-center"
                                        onClick={() => handleShareTrack(track.versions.find(v => v.is_latest_version)?.id || track.id)}
                                      >
                                        <Share2 className="h-4 w-4" />
                                        Share
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="flex gap-2 items-center"
                                        onClick={() => navigate(`/track/${track.id}/version`)}
                                      >
                                        <FilePlus className="h-4 w-4" />
                                        New Version
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="flex gap-2 items-center text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleDeletePrompt(track.id, track.title)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      
                      {/* Mobile View */}
                      <div className={`${isMobile ? 'block' : 'hidden'} md:hidden`}>
                        {tracks.map((track) => (
                          <MobileTrackCard 
                            key={track.id}
                            track={track}
                            onShareTrack={handleShareTrack}
                            onDeletePrompt={handleDeletePrompt}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-8 md:py-12 text-center border border-dashed border-wip-gray/30 rounded-md">
                      <p className="text-base md:text-lg text-gray-400 mb-4">You haven't uploaded any tracks yet</p>
                      <Button onClick={() => navigate("/")}>
                        Upload Your First Track
                      </Button>
                    </div>
                  )}
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
                  {isLoading ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading feedback data...</p>
                    </div>
                  ) : feedback.length > 0 ? (
                    <>
                      {/* Desktop View */}
                      {!isMobile && (
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Track</TableHead>
                                <TableHead>Average Rating</TableHead>
                                <TableHead>Feedback Count</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {feedback.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.trackTitle}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className={
                                        item.averageScore >= 8 ? "text-green-400" :
                                        item.averageScore >= 6 ? "text-yellow-400" : 
                                        "text-red-400"
                                      }>
                                        {item.averageScore.toFixed(1)}
                                      </span>
                                      <span className="text-xs text-gray-500">/10</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {item.feedbackCount} {item.feedbackCount === 1 ? 'review' : 'reviews'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleOpenTrack(item.trackId)}
                                    >
                                      Open
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      
                      {/* Mobile View */}
                      <div className={`${isMobile ? 'block' : 'hidden'} md:hidden`}>
                        {feedback.map((item) => (
                          <MobileFeedbackCard 
                            key={item.id}
                            feedback={item}
                            onOpenTrack={handleOpenTrack}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-8 md:py-12 text-center border border-dashed border-wip-gray/30 rounded-md">
                      <p className="text-base md:text-lg text-gray-400 mb-4">No feedback received yet</p>
                      <p className="text-gray-500 mb-4">Share your tracks with other producers to get feedback</p>
                    </div>
                  )}
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
};

export default ProfilePage;
