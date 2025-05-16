
import { useState, useEffect } from "react";
import { getFeedbackForTrack, Feedback } from "@/services/feedbackService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, ListFilter } from "lucide-react";

interface TrackFeedbackDisplayProps {
  trackId: string;
  trackTitle: string;
  trackVersion?: number;
}

const TrackFeedbackDisplay = ({ trackId, trackTitle, trackVersion = 1 }: TrackFeedbackDisplayProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userDetails, setUserDetails] = useState<Record<string, { username: string; avatarUrl?: string }>>({});
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showDetailedView, setShowDetailedView] = useState<boolean>(false);
  
  // Group feedback by version
  const [feedbackByVersion, setFeedbackByVersion] = useState<Record<number, Feedback[]>>({});
  const [availableVersions, setAvailableVersions] = useState<number[]>([]);
  
  // Average ratings
  const [averageRatings, setAverageRatings] = useState({
    mixing: 0,
    harmonies: 0,
    melodies: 0,
    soundDesign: 0,
    arrangement: 0,
  });
  
  const [djSetPercentage, setDjSetPercentage] = useState(0);
  const [listeningPercentage, setListeningPercentage] = useState(0);
  
  useEffect(() => {
    const loadFeedback = async () => {
      setIsLoading(true);
      const feedbackData = await getFeedbackForTrack(trackId);
      
      if (feedbackData.length > 0) {
        // Fetch usernames for non-anonymous feedback
        const userIds = feedbackData
          .filter(item => !item.anonymous && item.user_id)
          .map(item => item.user_id as string);
          
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);
            
          if (profiles) {
            const userMap: Record<string, { username: string; avatarUrl?: string }> = {};
            profiles.forEach(profile => {
              userMap[profile.id] = { 
                username: profile.username || 'Anonymous User',
                avatarUrl: profile.avatar_url || undefined
              };
            });
            setUserDetails(userMap);
          }
        }
        
        // Group feedback by version
        const feedbackGroups: Record<number, Feedback[]> = {};
        const versions = new Set<number>();
        
        feedbackData.forEach(item => {
          const version = item.version_number || 1;
          if (!feedbackGroups[version]) {
            feedbackGroups[version] = [];
          }
          feedbackGroups[version].push(item);
          versions.add(version);
        });
        
        setFeedbackByVersion(feedbackGroups);
        setAvailableVersions(Array.from(versions).sort((a, b) => b - a)); // Sort descending
        
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
      }
      
      setFeedback(feedbackData);
      setIsLoading(false);
    };
    
    if (trackId) {
      loadFeedback();
    }
  }, [trackId]);
  
  // Function to get the active feedback list based on selected tab
  const getActiveFeedbackList = (): Feedback[] => {
    if (activeTab === "all") {
      return feedback;
    } else if (activeTab === "latest") {
      const latestVersion = Math.max(...availableVersions);
      return feedbackByVersion[latestVersion] || [];
    } else {
      // The tab is a specific version number
      const versionNumber = parseInt(activeTab);
      return feedbackByVersion[versionNumber] || [];
    }
  };
  
  const calculateAverageScore = (
    property: keyof Pick<Feedback, 'melodies_score' | 'arrangement_score' | 'mixing_score' | 'harmonies_score' | 'sound_design_score'>,
    feedbackList: Feedback[]
  ) => {
    if (feedbackList.length === 0) return 0;
    const sum = feedbackList.reduce((acc, item) => acc + item[property], 0);
    return Math.round((sum / feedbackList.length) * 10) / 10;
  };
  
  const getDjPlayPercentage = (feedbackList: Feedback[]) => {
    if (feedbackList.length === 0) return 0;
    const djPlayCount = feedbackList.filter(item => item.dj_set_play).length;
    return Math.round((djPlayCount / feedbackList.length) * 100);
  };
  
  const getCasualListeningPercentage = (feedbackList: Feedback[]) => {
    if (feedbackList.length === 0) return 0;
    const casualCount = feedbackList.filter(item => item.casual_listening).length;
    return Math.round((casualCount / feedbackList.length) * 100);
  };
  
  const getLatestComment = (feedbackList: Feedback[]) => {
    if (feedbackList.length === 0) return null;
    
    // Sort feedback by date (newest first) and find the first one with a written comment
    const sortedFeedback = [...feedbackList].sort((a, b) => {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    
    return sortedFeedback.find(item => item.written_feedback)?.written_feedback || null;
  };
  
  const getCommentorName = (feedbackItem: Feedback) => {
    if (feedbackItem.anonymous) return "Anonymous";
    if (feedbackItem.guest_name) return feedbackItem.guest_name;
    if (feedbackItem.user_id && userDetails[feedbackItem.user_id]) {
      return userDetails[feedbackItem.user_id].username;
    }
    return "User";
  };
  
  const getUserAvatar = (feedbackItem: Feedback) => {
    if (feedbackItem.user_id && userDetails[feedbackItem.user_id]) {
      return userDetails[feedbackItem.user_id].avatarUrl;
    }
    return undefined;
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };
  
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400";
    if (rating >= 6) return "text-yellow-400";
    return "text-red-400";
  };
  
  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  
  if (feedback.length === 0) {
    return (
      <div className="text-center p-8 mt-8">
        <p className="text-gray-400">No feedback available for this track yet.</p>
      </div>
    );
  }
  
  // Get the active feedback list based on tab selection
  const activeFeedbackList = getActiveFeedbackList();
  
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold gradient-text">
          Feedback {showDetailedView ? "Details" : "Summary"} ({feedback.length})
          {activeTab !== "all" && activeTab !== "latest" && (
            <span className="ml-2 text-wip-pink">Version {activeTab}</span>
          )}
        </h2>
        
        <div className="flex space-x-2">
          <Toggle 
            pressed={showDetailedView} 
            onPressedChange={setShowDetailedView}
            aria-label="Toggle detailed view"
            className="border-wip-pink text-wip-pink hover:bg-wip-pink/10 data-[state=on]:bg-wip-pink/20"
          >
            {showDetailedView ? (
              <><ChevronUp className="h-4 w-4 mr-2" /> Summary View</>
            ) : (
              <><ChevronDown className="h-4 w-4 mr-2" /> Detailed View</>
            )}
          </Toggle>
        </div>
      </div>
      
      {/* Version tabs */}
      {availableVersions.length > 1 && (
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="bg-wip-dark">
            <TabsTrigger value="all">All Versions</TabsTrigger>
            <TabsTrigger value="latest">Latest Version</TabsTrigger>
            {availableVersions.map(version => (
              <TabsTrigger key={`version-${version}`} value={version.toString()}>
                Version {version}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      
      {!showDetailedView ? (
        // SUMMARY VIEW
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-wip-darker border-wip-gray/20">
            <CardHeader>
              <CardTitle className="text-wip-pink">Rating Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Melodies</span>
                  <span className="font-semibold">{calculateAverageScore('melodies_score', activeFeedbackList)}/10</span>
                </div>
                <Progress value={calculateAverageScore('melodies_score', activeFeedbackList) * 10} className="h-2 bg-wip-gray/30" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Arrangement</span>
                  <span className="font-semibold">{calculateAverageScore('arrangement_score', activeFeedbackList)}/10</span>
                </div>
                <Progress value={calculateAverageScore('arrangement_score', activeFeedbackList) * 10} className="h-2 bg-wip-gray/30" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Mixing</span>
                  <span className="font-semibold">{calculateAverageScore('mixing_score', activeFeedbackList)}/10</span>
                </div>
                <Progress value={calculateAverageScore('mixing_score', activeFeedbackList) * 10} className="h-2 bg-wip-gray/30" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Harmonies</span>
                  <span className="font-semibold">{calculateAverageScore('harmonies_score', activeFeedbackList)}/10</span>
                </div>
                <Progress value={calculateAverageScore('harmonies_score', activeFeedbackList) * 10} className="h-2 bg-wip-gray/30" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Sound Design</span>
                  <span className="font-semibold">{calculateAverageScore('sound_design_score', activeFeedbackList)}/10</span>
                </div>
                <Progress value={calculateAverageScore('sound_design_score', activeFeedbackList) * 10} className="h-2 bg-wip-gray/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-wip-darker border-wip-gray/20">
            <CardHeader>
              <CardTitle className="text-wip-pink">Usage Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Would play in a DJ set</span>
                  <span className="font-semibold">{getDjPlayPercentage(activeFeedbackList)}%</span>
                </div>
                <Progress value={getDjPlayPercentage(activeFeedbackList)} className="h-3 bg-wip-gray/30" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Would listen casually</span>
                  <span className="font-semibold">{getCasualListeningPercentage(activeFeedbackList)}%</span>
                </div>
                <Progress value={getCasualListeningPercentage(activeFeedbackList)} className="h-3 bg-wip-gray/30" />
              </div>
              
              {getLatestComment(activeFeedbackList) && (
                <div className="mt-4 pt-4 border-t border-wip-gray/20">
                  <h3 className="text-wip-pink mb-2">Latest Comment:</h3>
                  <p className="text-gray-300 italic">{getLatestComment(activeFeedbackList)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // DETAILED VIEW
        <div className="space-y-6">
          {/* Average Scores Card */}
          <Card className="bg-wip-darker border-wip-gray">
            <CardHeader>
              <CardTitle className="gradient-text">
                Feedback Summary ({activeFeedbackList.length})
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
          
          {/* Individual Feedback Items */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold gradient-text">
              Individual Feedback
            </h2>
            
            {activeFeedbackList.map((item) => (
              <Card key={item.id} className="bg-wip-darker border-wip-gray">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      {getUserAvatar(item) && <AvatarImage src={getUserAvatar(item)} alt={getCommentorName(item)} />}
                      <AvatarFallback className="bg-wip-pink/20 text-wip-pink">
                        {getInitials(getCommentorName(item))}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{getCommentorName(item)}</h3>
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
        </div>
      )}
    </div>
  );
};

export default TrackFeedbackDisplay;
