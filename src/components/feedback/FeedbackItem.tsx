
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Feedback } from "@/services/feedbackService";

interface FeedbackItemProps {
  item: Feedback;
  userDisplayName: string;
  avatarUrl?: string;
  createdDate: string;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({
  item,
  userDisplayName,
  avatarUrl,
  createdDate
}) => {
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
    <Card key={item.id} className="bg-wip-darker border-wip-gray">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar>
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userDisplayName} />}
            <AvatarFallback className="bg-wip-pink/20 text-wip-pink">
              {getInitials(userDisplayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{userDisplayName}</h3>
                <p className="text-xs text-gray-500">{createdDate}</p>
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
  );
};

export default React.memo(FeedbackItem);
