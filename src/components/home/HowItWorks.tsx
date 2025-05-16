
const HowItWorks = () => {
  return (
    <div className="mt-16 px-6 py-8 w-full max-w-3xl mx-auto border border-wip-gray/30 rounded-lg bg-wip-gray/5">
      <h3 className="text-xl font-semibold mb-4">How It Works</h3>
      
      <ol className="space-y-6">
        <li className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
            1
          </div>
          <div>
            <h4 className="font-medium">Upload Your Track</h4>
            <p className="text-gray-400">
              Drag and drop your audio file (WAV, FLAC, AIFF, or MP3).
            </p>
          </div>
        </li>
        
        <li className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
            2
          </div>
          <div>
            <h4 className="font-medium">Share with Others</h4>
            <p className="text-gray-400">
              Generate a link to share your track with other producers.
            </p>
          </div>
        </li>
        
        <li className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
            3
          </div>
          <div>
            <h4 className="font-medium">Get Detailed Feedback</h4>
            <p className="text-gray-400">
              Receive ratings on mixing, melody, sound design, and more, along with written feedback.
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
};

export default HowItWorks;
