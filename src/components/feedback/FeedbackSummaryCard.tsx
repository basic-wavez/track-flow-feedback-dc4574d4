
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RatingsSummary {
  mixing: number;
  harmonies: number;
  melodies: number;
  soundDesign: number;
  arrangement: number;
}

interface FeedbackSummaryCardProps {
  averageRatings: RatingsSummary;
  djSetPercentage: number;
  listeningPercentage: number;
  feedbackCount: number;
}

const FeedbackSummaryCard = ({ 
  averageRatings, 
  djSetPercentage, 
  listeningPercentage,
  feedbackCount
}: FeedbackSummaryCardProps) => {
  
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400";
    if (rating >= 6) return "text-yellow-400";
    return "text-red-400";
  };
  
  return (
    <Card className="bg-wip-darker border-wip-gray">
      <CardHeader>
        <CardTitle className="gradient-text">
          Feedback Summary ({feedbackCount})
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
  );
};

export default FeedbackSummaryCard;
