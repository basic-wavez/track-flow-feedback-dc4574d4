
import { useState, useEffect } from "react";
import { getFeedbackForTrack, Feedback } from "@/services/feedbackService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TrackFeedbackDisplayProps {
  trackId: string;
  trackTitle: string;
  trackVersion?: number;
}

const TrackFeedbackDisplay = ({ trackId, trackTitle, trackVersion = 1 }: TrackFeedbackDisplayProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userDetails, setUserDetails] = useState<Record<string, { username: string }>>({});
  const [activeTab, setActiveTab] = useState<string>("all");
  const navigate = useNavigate();
  
  // Group feedback by version
  const [feedbackByVersion, setFeedbackByVersion] = useState<Record<number, Feedback[]>>({});
  const [availableVersions, setAvailableVersions] = useState<number[]>([]);
  
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
            .select('id, username')
            .in('id', userIds);
            
          if (profiles) {
            const userMap: Record<string, { username: string }> = {};
            profiles.forEach(profile => {
              userMap[profile.id] = { 
                username: profile.username || 'Anonymous User'
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
          Feedback Summary ({feedback.length})
          {activeTab !== "all" && activeTab !== "latest" && (
            <span className="ml-2 text-wip-pink">Version {activeTab}</span>
          )}
        </h2>
        <Button 
          variant="outline" 
          className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
          onClick={() => navigate(`/feedback/${trackId}`)}
        >
          View Detailed Feedback
        </Button>
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
    </div>
  );
};

export default TrackFeedbackDisplay;
