
import { Progress } from "@/components/ui/progress";

interface UploadStatusProps {
  fileName: string;
  progress: number;
  processingState: string;
}

const UploadStatus = ({ fileName, progress, processingState }: UploadStatusProps) => {
  return (
    <div className="border border-wip-gray bg-wip-gray/20 rounded-lg p-8">
      <h3 className="text-xl font-semibold mb-4">Processing Your Track</h3>
      <p className="mb-4 text-gray-400">
        {fileName}
      </p>
      <Progress value={progress} className="h-2 mb-4" />
      <p className="text-sm text-gray-500">
        {processingState || (
          progress < 30 ? "Preparing upload..." : 
          progress < 50 ? "Creating upload..." :
          progress < 90 ? "Uploading to server..." : 
          "Almost done..."
        )}
      </p>
    </div>
  );
};

export default UploadStatus;
