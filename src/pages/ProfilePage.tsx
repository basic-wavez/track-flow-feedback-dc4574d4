
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getUserTracks } from "@/services/trackService";
import { formatDistanceToNow } from "date-fns";
import { Music, MessageSquare, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { TrackData } from "@/types/track";
import { supabase } from "@/integrations/supabase/client";

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
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackSummary[]>([]);
  const [activeTab, setActiveTab] = useState("tracks");
  
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch user tracks
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
  
  const handleViewTrack = (trackId: string) => {
    navigate(`/track/${trackId}`);
  };
  
  const handleViewFeedback = (trackId: string) => {
    navigate(`/feedback/${trackId}`);
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
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
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text">My Profile</h1>
            <p className="text-gray-400 mt-2">
              {user.email}
            </p>
          </div>
          
          <Tabs 
            defaultValue="tracks" 
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="tracks" className="flex gap-2 items-center">
                <Music className="h-4 w-4" />
                <span>My Tracks</span>
                <Badge variant="outline" className="ml-1">
                  {tracks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex gap-2 items-center">
                <MessageSquare className="h-4 w-4" />
                <span>Track Feedback</span>
                <Badge variant="outline" className="ml-1">
                  {feedback.length}
                </Badge>
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tracks.map((track) => (
                          <TableRow key={track.id}>
                            <TableCell className="font-medium">{track.title}</TableCell>
                            <TableCell>
                              {track.processing_status === 'completed' ? (
                                <Badge className="bg-green-600">Ready</Badge>
                              ) : (
                                <Badge className="bg-yellow-600">Processing</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(track.created_at || ""), { addSuffix: true })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleViewTrack(track.id)}
                                >
                                  Play
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewFeedback(track.id)}
                                >
                                  Feedback
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-12 text-center border border-dashed border-wip-gray/30 rounded-md">
                      <p className="text-lg text-gray-400 mb-4">You haven't uploaded any tracks yet</p>
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
                                onClick={() => handleViewFeedback(item.trackId)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-12 text-center border border-dashed border-wip-gray/30 rounded-md">
                      <p className="text-lg text-gray-400 mb-4">No feedback received yet</p>
                      <p className="text-gray-500 mb-4">Share your tracks with other producers to get feedback</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
