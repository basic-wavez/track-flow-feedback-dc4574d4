
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TrackPlayer from "@/components/TrackPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface FeedbackItem {
  id: string;
  userName: string;
  userAvatar?: string;
  createdAt: Date;
  ratings: {
    mixing: number;
    harmonies: number;
    melodies: number;
    soundDesign: number;
    arrangement: number;
  };
  wouldPlayDJ: boolean;
  wouldListen: boolean;
  additionalFeedback?: string;
}

const FeedbackView = () => {
  const { trackId } = useParams();
  const [trackName, setTrackName] = useState("Untitled Track");
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
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
    // In a real app, this would fetch the track and feedback from Supabase
    // For this demo, we'll use placeholder data
    setTrackName("Midnight Groove (WIP)");
    
    const mockFeedback: FeedbackItem[] = [
      {
        id: "1",
        userName: "DJ Beatmaster",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        ratings: {
          mixing: 7,
          harmonies: 8,
          melodies: 9,
          soundDesign: 6,
          arrangement: 7,
        },
        wouldPlayDJ: true,
        wouldListen: true,
        additionalFeedback: "Love the vibe! The drop at 1:30 is awesome, but the mix could use some work on the low end. The bass is a bit muddy."
      },
      {
        id: "2",
        userName: "SoundWizard",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        ratings: {
          mixing: 6,
          harmonies: 9,
          melodies: 8,
          soundDesign: 9,
          arrangement: 7,
        },
        wouldPlayDJ: true,
        wouldListen: false,
        additionalFeedback: "Great sound design! The synths are really unique. I think the arrangement could use some work - it feels like it's missing a proper build up."
      },
      {
        id: "3",
        userName: "MusicLover",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        ratings: {
          mixing: 5,
          harmonies: 7,
          melodies: 8,
          soundDesign: 6,
          arrangement: 5,
        },
        wouldPlayDJ: false,
        wouldListen: true,
        additionalFeedback: "I enjoyed the melody, but I think the track needs more dynamics. It feels a bit flat throughout."
      }
    ];
    
    setFeedback(mockFeedback);
    
    // Calculate averages
    const total = mockFeedback.length;
    const sumRatings = mockFeedback.reduce(
      (acc, item) => {
        return {
          mixing: acc.mixing + item.ratings.mixing,
          harmonies: acc.harmonies + item.ratings.harmonies,
          melodies: acc.melodies + item.ratings.melodies,
          soundDesign: acc.soundDesign + item.ratings.soundDesign,
          arrangement: acc.arrangement + item.ratings.arrangement,
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
    
    const djYesCount = mockFeedback.filter(item => item.wouldPlayDJ).length;
    const listenYesCount = mockFeedback.filter(item => item.wouldListen).length;
    
    setDjSetPercentage(Math.round((djYesCount / total) * 100));
    setListeningPercentage(Math.round((listenYesCount / total) * 100));
    
  }, [trackId]);

  const formatDate = (date: Date) => {
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

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400";
    if (rating >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-12">
        <TrackPlayer 
          trackId={trackId || ''}
          trackName={trackName} 
          isOwner={true}
        />
        
        <Card className="bg-wip-darker border-wip-gray">
          <CardHeader>
            <CardTitle className="gradient-text">
              Feedback Summary ({feedback.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Average Ratings */}
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
              
              {/* Yes/No Questions */}
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
                    {item.userAvatar && <AvatarImage src={item.userAvatar} alt={item.userName} />}
                    <AvatarFallback className="bg-wip-pink/20 text-wip-pink">
                      {getInitials(item.userName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.userName}</h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {item.wouldPlayDJ && (
                          <Badge variant="outline" className="border-green-500 text-green-500">
                            Would DJ
                          </Badge>
                        )}
                        {item.wouldListen && (
                          <Badge variant="outline" className="border-blue-500 text-blue-500">
                            Would Listen
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getRatingColor(item.ratings.mixing)}`}>
                          {item.ratings.mixing}
                        </div>
                        <div className="text-xs text-gray-500">Mixing</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getRatingColor(item.ratings.harmonies)}`}>
                          {item.ratings.harmonies}
                        </div>
                        <div className="text-xs text-gray-500">Harmonies</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getRatingColor(item.ratings.melodies)}`}>
                          {item.ratings.melodies}
                        </div>
                        <div className="text-xs text-gray-500">Melodies</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getRatingColor(item.ratings.soundDesign)}`}>
                          {item.ratings.soundDesign}
                        </div>
                        <div className="text-xs text-gray-500">Sound Design</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getRatingColor(item.ratings.arrangement)}`}>
                          {item.ratings.arrangement}
                        </div>
                        <div className="text-xs text-gray-500">Arrangement</div>
                      </div>
                    </div>
                    
                    {item.additionalFeedback && (
                      <div className="mt-4 p-4 bg-wip-gray/10 rounded-md">
                        <p className="text-gray-300">{item.additionalFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackView;
