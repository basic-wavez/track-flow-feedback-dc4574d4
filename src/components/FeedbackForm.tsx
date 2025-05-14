
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";

interface FeedbackFormProps {
  trackName: string;
  onFeedbackSubmit: () => void;
  onLoginRequest: () => void;
}

const FeedbackForm = ({ trackName, onFeedbackSubmit, onLoginRequest }: FeedbackFormProps) => {
  const [mixingRating, setMixingRating] = useState<number>(5);
  const [harmoniesRating, setHarmoniesRating] = useState<number>(5);
  const [melodiesRating, setMelodiesRating] = useState<number>(5);
  const [soundDesignRating, setSoundDesignRating] = useState<number>(5);
  const [arrangementRating, setArrangementRating] = useState<number>(5);
  const [wouldPlayDJ, setWouldPlayDJ] = useState<string>("no");
  const [wouldListen, setWouldListen] = useState<string>("no");
  const [additionalFeedback, setAdditionalFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app with Supabase integration, we would save the feedback to the database
      // For this demo, we'll simulate success after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been sent to the artist.",
      });
      
      onFeedbackSubmit();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingOptions = (
    value: number,
    onChange: (value: number) => void,
    name: string
  ) => (
    <div className="flex items-center justify-between space-x-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={`w-7 h-7 rounded-full text-xs flex items-center justify-center transition-all ${
            value === rating
              ? "bg-wip-pink text-white"
              : "bg-wip-gray/30 text-gray-400 hover:bg-wip-pink/30"
          }`}
        >
          {rating}
        </button>
      ))}
    </div>
  );

  return (
    <Card className="w-full max-w-3xl mx-auto bg-wip-darker border-wip-gray">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Provide Feedback for "{trackName}"
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Rating Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mixing {mixingRating}/10</Label>
              {renderRatingOptions(mixingRating, setMixingRating, "mixing")}
            </div>
            
            <div className="space-y-2">
              <Label>Harmonies {harmoniesRating}/10</Label>
              {renderRatingOptions(harmoniesRating, setHarmoniesRating, "harmonies")}
            </div>
            
            <div className="space-y-2">
              <Label>Melodies {melodiesRating}/10</Label>
              {renderRatingOptions(melodiesRating, setMelodiesRating, "melodies")}
            </div>
            
            <div className="space-y-2">
              <Label>Sound Design {soundDesignRating}/10</Label>
              {renderRatingOptions(soundDesignRating, setSoundDesignRating, "soundDesign")}
            </div>
            
            <div className="space-y-2">
              <Label>Arrangement {arrangementRating}/10</Label>
              {renderRatingOptions(arrangementRating, setArrangementRating, "arrangement")}
            </div>
          </div>
          
          {/* Yes/No Questions */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Would you play it in a DJ set?</Label>
              <RadioGroup 
                value={wouldPlayDJ} 
                onValueChange={setWouldPlayDJ}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="dj-yes" />
                  <Label htmlFor="dj-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="dj-no" />
                  <Label htmlFor="dj-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Would you listen to it casually?</Label>
              <RadioGroup 
                value={wouldListen} 
                onValueChange={setWouldListen}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="listen-yes" />
                  <Label htmlFor="listen-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="listen-no" />
                  <Label htmlFor="listen-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          {/* Additional Feedback */}
          <div className="space-y-2">
            <Label htmlFor="additional-feedback">Additional Feedback (Optional)</Label>
            <Textarea
              id="additional-feedback"
              placeholder="Share any specific thoughts or suggestions..."
              value={additionalFeedback}
              onChange={(e) => setAdditionalFeedback(e.target.value)}
              className="min-h-32"
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onLoginRequest}
            className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
          >
            Sign in to Track Feedback
          </Button>
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="gradient-bg hover:opacity-90"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default FeedbackForm;
