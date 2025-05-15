
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrackPlayer from "@/components/TrackPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTrack } from "@/services/trackService";
import { TrackData } from "@/types/track";
import { getFeedbackForTrack, Feedback } from "@/services/feedbackService";
import { supabase } from "@/integrations/supabase/client";

const FeedbackView = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [userDetails, setUserDetails] = useState<Record<string, { username: string, avatarUrl?: string }>>({});
  const [averageRatings, setAverageRatings] = useState({
    mixing: 0,
    harmonies: 0,
    melodies: 0,
    soundDesign: 0,
    arrangement: 0,
  });
  const [djSetPercentage, setDjSetPercentage] = useState(0);
  const [listeningPercentage, setListeningPercentage] = useState(0);

  // Fetch track data
  useEffect(() => {
    const fetchTrackData = async () => {
      if (!trackId) return;

      setIsLoading(true);
      try {
        const track = await getTrack(trackId);
        if (track) {
          setTrackData(track);
        }
      } catch (error) {
        console.error("Error fetching track:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackData();
  }, [trackId]);

  // Fetch feedback data
  useEffect(() => {
    const fetchFeedback = async () => {
      if (!trackId) return;
      
      try {
        const feedbackData = await getFeedbackForTrack(trackId);
        setFeedback(feedbackData);
        
        // Extract user IDs from feedback to fetch user details
        const userIds = feedbackData
          .filter(item => !item.anonymous && item.user_id)
          .map(item => item.user_id as string);
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);
            
          if (profiles) {
            const userMap: Record<string, { username: string, avatarUrl?: string }> = {};
            profiles.forEach(profile => {
              userMap[profile.id] = { 
                username: profile.username || 'Anonymous User',
                avatarUrl: profile.avatar_url || undefined
              };
            });
            setUserDetails(userMap);
          }
        }
        
        // Calculate averages
        if (feedbackData.length > 0) {
          const total = feedbackData.length;
          const sumRatings = feedbackData.reduce(
            (acc, item) => {
              return {
                mixing: acc.mixing + item.mixing_score,
                harmonies: acc.harmonies + item.harmonies_score,
                melodies: acc.melodies + item.melodies_score,
                soundDesign: acc.soundDesign + item.sound_design_score,
                arrangement: acc.arrangement + item.arrangement_score,
              };
            },
            { mixing: 0, harmonies: 0, melodies: 0, soundDesign: 0, arrangement: 0 }
          );
          
          setAverageRatings({
            mixing: parseFloat((sumRatings.mixing / total).toFixed(1)),
            harmonies: parseFloat((sumRatings.harmonies / total).toFixed(1)),
            melodies: parseFloat((sumRatings.melodies / total).toFixed(1)),
            soundDesign: parseFloat((sumRatings.soundDesign / total).toFixed(1)),
            arrangement: parseFloat((sumRatings.arrangement / total).toFixed(1)),
          });
          
          const djYesCount = feedbackData.filter(item => item.dj_set_play).length;
          const listenYesCount = feedbackData.filter(item => item.casual_listening).length;
          
          setDjSetPercentage(Math.round((djYesCount / total) * 100));
          setListeningPercentage(Math.round((listenYesCount / total) * 100));
        }
        
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    };

    fetchFeedback();
  }, [trackId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  const getUserDisplayName = (feedbackItem: Feedback) => {
    if (feedbackItem.anonymous) return "Anonymous";
    if (feedbackItem.user_id && userDetails[feedbackItem.user_id]) {
      return userDetails[feedbackItem.user_id].username;
    }
    return "Unknown User";
  };
  
  const getUserAvatar = (feedbackItem: Feedback) => {
    if (feedbackItem.user_id && userDetails[feedbackItem.user_id]) {
      return userDetails[feedbackItem.user_id].avatarUrl;
    }
    return undefined;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400";
    if (rating >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen flex flex-col bg-wip-dark">
      <Header />
      
      <div className="py-6 px-8 border-b border-wip-gray/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-wip-pink hover:bg-wip-pink/10"
              onClick={() => navigate(`/track/${trackId}`)}
            >
              <ChevronLeft size={16} />
              <span>Back to Track</span>
            </Button>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    href="/" 
                    className={navigationMenuTriggerStyle()}
                  >
                    Home
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    href="/profile" 
                    className={navigationMenuTriggerStyle()}
                  >
                    My Profile
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          {trackData ? (
            <TrackPlayer 
              trackId={trackId || ''}
              trackName={trackData.title || 'Untitled Track'} 
              audioUrl={trackData.mp3_url || trackData.compressed_url}
              originalUrl={trackData.original_url}
              originalFilename={trackData.original_filename}
              isOwner={true}
            />
          ) : (
            <div className="h-60 bg-wip-darker rounded-lg flex items-center justify-center">
              <p className="text-wip-pink">{isLoading ? 'Loading track...' : 'Track not found'}</p>
            </div>
          )}
          
          {feedback.length > 0 ? (
            <>
              <Card className="bg-wip-darker border-wip-gray">
                <CardHeader>
                  <CardTitle className="gradient-text">
                    Feedback Summary ({feedback.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold mb-2">Average Ratings</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Mixing</span>
                          <span className={getRatingColor(averageRatings.mixing)}>
                            {averageRatings.mixing}/10
                          </span>
                        </div>
                        <Progress value={averageRatings.mixing * 10} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Harmonies</span>
                          <span className={getRatingColor(averageRatings.harmonies)}>
                            {averageRatings.harmonies}/10
                          </span>
                        </div>
                        <Progress value={averageRatings.harmonies * 10} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Melodies</span>
                          <span className={getRatingColor(averageRatings.melodies)}>
                            {averageRatings.melodies}/10
                          </span>
                        </div>
                        <Progress value={averageRatings.melodies * 10} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Sound Design</span>
                          <span className={getRatingColor(averageRatings.soundDesign)}>
                            {averageRatings.soundDesign}/10
                          </span>
                        </div>
                        <Progress value={averageRatings.soundDesign * 10} className="h-2" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Arrangement</span>
                          <span className={getRatingColor(averageRatings.arrangement)}>
                            {averageRatings.arrangement}/10
                          </span>
                        </div>
                        <Progress value={averageRatings.arrangement * 10} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <h3 className="font-semibold mb-2">Overall Reception</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Would play in a DJ set</span>
                            <span className="font-semibold">{djSetPercentage}%</span>
                          </div>
                          <div className="w-full bg-wip-gray/30 rounded-full h-4">
                            <div 
                              className="gradient-bg h-4 rounded-full"
                              style={{ width: `${djSetPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Would listen casually</span>
                            <span className="font-semibold">{listeningPercentage}%</span>
                          </div>
                          <div className="w-full bg-wip-gray/30 rounded-full h-4">
                            <div 
                              className="gradient-bg h-4 rounded-full"
                              style={{ width: `${listeningPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <h3 className="font-semibold mb-3">Strongest Elements</h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(averageRatings)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 2)
                            .map(([key, value]) => (
                              <Badge key={key} className="gradient-bg py-1 px-3">
                                {key.charAt(0).toUpperCase() + key.slice(1)}: {value}/10
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <h2 className="text-2xl font-bold gradient-text">
                  Individual Feedback
                </h2>
                
                {feedback.map((item) => (
                  <Card key={item.id} className="bg-wip-darker border-wip-gray">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          {getUserAvatar(item) && <AvatarImage src={getUserAvatar(item)} alt={getUserDisplayName(item)} />}
                          <AvatarFallback className="bg-wip-pink/20 text-wip-pink">
                            {getInitials(getUserDisplayName(item))}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{getUserDisplayName(item)}</h3>
                              <p className="text-xs text-gray-500">
                                {item.created_at ? formatDate(item.created_at) : ''}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              {item.dj_set_play && (
                                <Badge variant="outline" className="border-green-500 text-green-500">
                                  Would DJ
                                </Badge>
                              )}
                              {item.casual_listening && (
                                <Badge variant="outline" className="border-blue-500 text-blue-500">
                                  Would Listen
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-5 gap-4">
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getRatingColor(item.mixing_score)}`}>
                                {item.mixing_score}
                              </div>
                              <div className="text-xs text-gray-500">Mixing</div>
                            </div>
                            
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getRatingColor(item.harmonies_score)}`}>
                                {item.harmonies_score}
                              </div>
                              <div className="text-xs text-gray-500">Harmonies</div>
                            </div>
                            
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getRatingColor(item.melodies_score)}`}>
                                {item.melodies_score}
                              </div>
                              <div className="text-xs text-gray-500">Melodies</div>
                            </div>
                            
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getRatingColor(item.sound_design_score)}`}>
                                {item.sound_design_score}
                              </div>
                              <div className="text-xs text-gray-500">Sound Design</div>
                            </div>
                            
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getRatingColor(item.arrangement_score)}`}>
                                {item.arrangement_score}
                              </div>
                              <div className="text-xs text-gray-500">Arrangement</div>
                            </div>
                          </div>
                          
                          {item.written_feedback && (
                            <div className="mt-4 p-4 bg-wip-gray/10 rounded-md">
                              <p className="text-gray-300">{item.written_feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold gradient-text mb-4">No Feedback Yet</h2>
              <p className="text-gray-400">
                This track hasn't received any feedback yet. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FeedbackView;
