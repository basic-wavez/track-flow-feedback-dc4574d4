
import { UploadCloud, Link2, TrendingUp, GitBranch, MessageSquare } from "lucide-react";

const HowItWorks = () => {
  return (
    <div className="mt-16 px-6 py-8 w-full max-w-3xl mx-auto border border-wip-gray/30 rounded-lg bg-wip-gray/5">
      <h3 className="text-xl font-semibold mb-4">How It Works</h3>
      
      <ol className="space-y-6">
        <li className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
            1
          </div>
          <div className="flex-1">
            <h4 className="font-medium flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              Upload Your Track
            </h4>
            <p className="text-gray-400">
              Drag and drop your demo (WAV, FLAC, AIFF, or MP3).
            </p>
          </div>
        </li>
        
        <li className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
            2
          </div>
          <div className="flex-1">
            <h4 className="font-medium flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Create Shareable Links
            </h4>
            <p className="text-gray-400">
              Generate up to 10 unique links per track — perfect for pitching to different labels or contacts.
            </p>
          </div>
        </li>
        
        <li className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
            3
          </div>
          <div className="flex-1">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Track Plays & Downloads
            </h4>
            <p className="text-gray-400">
              See exactly how each link performs with detailed play and download stats.
            </p>
          </div>
        </li>
        
        <li className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
            4
          </div>
          <div className="flex-1">
            <h4 className="font-medium flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Get Version Control
            </h4>
            <p className="text-gray-400">
              Upload new versions of your track anytime. Add notes, share new links, and keep feedback organized.
            </p>
          </div>
        </li>
        
        <li className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
            5
          </div>
          <div className="flex-1">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Collect Targeted Feedback
            </h4>
            <p className="text-gray-400">
              Get ratings and written feedback on mixing, melody, sound design, and more — all in one place.
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
};

export default HowItWorks;
