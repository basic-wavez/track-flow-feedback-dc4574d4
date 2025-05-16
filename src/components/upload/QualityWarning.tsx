
import { Button } from "@/components/ui/button";

interface QualityWarningProps {
  onCancel: () => void;
  onContinue: () => void;
}

const QualityWarning = ({ onCancel, onContinue }: QualityWarningProps) => {
  return (
    <div className="border border-yellow-600 bg-yellow-600/20 rounded-lg p-8">
      <h3 className="text-xl font-semibold mb-4 text-yellow-400">⚠️ Quality Warning</h3>
      <p className="mb-4">
        You're uploading an MP3 file, which is already compressed. Further processing may reduce audio quality.
      </p>
      <p className="mb-6 text-sm text-gray-400">
        For best results, we recommend uploading lossless formats (WAV, FLAC, AIFF).
      </p>
      <div className="flex space-x-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          className="gradient-bg hover:opacity-90"
          onClick={onContinue}
        >
          Continue Anyway
        </Button>
      </div>
    </div>
  );
};

export default QualityWarning;
