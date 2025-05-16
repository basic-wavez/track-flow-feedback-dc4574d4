
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackFormProps {
  trackId?: string;
  trackName: string;
  trackVersion?: number;
  onFeedbackSubmit: () => void;
  onLoginRequest: () => void;
}

const FeedbackForm = ({ 
  trackId, 
  trackName, 
  trackVersion = 1, // Default to version 1 if not specified
  onFeedbackSubmit, 
  onLoginRequest 
}: FeedbackFormProps) => {
  const { user } = useAuth();
  const [mixingRating, setMixingRating] = useState<number>(5);
  const [harmoniesRating, setHarmoniesRating] = useState<number>(5);
  const [melodiesRating, setMelodiesRating] = useState<number>(5);
  const [soundDesignRating, setSoundDesignRating] = useState<number>(5);
  const [arrangementRating, setArrangementRating] = useState<number>(5);
  const [wouldPlayDJ, setWouldPlayDJ] = useState<boolean>(false);
  const [wouldListen, setWouldListen] = useState<boolean>(false);
  const [additionalFeedback, setAdditionalFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestName, setGuestName] = useState<string>("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!trackId) {
        throw new Error("Track ID is missing");
      }
      
      // Submit feedback to Supabase
      const { data, error } = await supabase
        .from('feedback')
        .insert([
          {
            track_id: trackId,
            mixing_score: mixingRating,
            harmonies_score: harmoniesRating,
            melodies_score: melodiesRating,
            sound_design_score: soundDesignRating,
            arrangement_score: arrangementRating,
            dj_set_play: wouldPlayDJ,
            casual_listening: wouldListen,
            written_feedback: additionalFeedback || null,
            user_id: user?.id || null,
            anonymous: false, // Always set to false since we're removing the anonymous option
            guest_name: !user?.id ? guestName : null,
            version_number: trackVersion // Include the track version number
          }
        ]);
      
      if (error) {
        console.error("Feedback submission error:", error);
        throw error;
      }
      
      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been sent to the artist.",
      });
      
      onFeedbackSubmit();
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSlider = (
    value: number,
    onChange: (value: number[]) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-medium">{value}/10</span>
      </div>
      <Slider
        defaultValue={[value]}
        max={10}
        min={1}
        step={1}
        onValueChange={(values) => onChange([...values])}
        className="w-full h-1.5"
        aria-label={`${label} rating`}
      />
    </div>
  );

  const showGuestFields = !user;

  return (
    <Card className="w-full max-w-3xl mx-auto bg-wip-darker border-wip-gray">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Provide Feedback for "{trackName}" {trackVersion > 1 && <span className="text-wip-pink ml-2">(v{trackVersion})</span>}
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* User Status Section */}
          {!user && (
            <div className="p-4 border border-wip-gray/30 rounded-md bg-wip-darker">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">Submit as Guest</h3>
                  <p className="text-sm text-gray-400">You're not signed in</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLoginRequest}
                  className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
                >
                  Sign in
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-name" className="text-sm">Your Name</Label>
                  <Input
                    id="guest-name"
                    placeholder="Enter your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required={showGuestFields}
                    className="bg-wip-gray/10"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Rating Fields with Sliders */}
          <div className="space-y-4">
            {renderSlider(mixingRating, (values) => setMixingRating(values[0]), "Mixing")}
            {renderSlider(harmoniesRating, (values) => setHarmoniesRating(values[0]), "Harmonies")}
            {renderSlider(melodiesRating, (values) => setMelodiesRating(values[0]), "Melodies")}
            {renderSlider(soundDesignRating, (values) => setSoundDesignRating(values[0]), "Sound Design")}
            {renderSlider(arrangementRating, (values) => setArrangementRating(values[0]), "Arrangement")}
          </div>
          
          {/* Yes/No Questions */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Would you play it in a DJ set?</Label>
                <p className="text-sm text-gray-400">For club or event play</p>
              </div>
              <Switch 
                checked={wouldPlayDJ}
                onCheckedChange={setWouldPlayDJ}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Would you listen casually?</Label>
                <p className="text-sm text-gray-400">For personal enjoyment</p>
              </div>
              <Switch 
                checked={wouldListen}
                onCheckedChange={setWouldListen}
              />
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
        
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            type="submit" 
            disabled={isSubmitting || (showGuestFields && !guestName)}
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
