
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UploadErrorProps {
  errorMessage: string;
  onReset: () => void;
}

const UploadError = ({ errorMessage, onReset }: UploadErrorProps) => {
  return (
    <div className="border border-red-600 bg-red-600/20 rounded-lg p-8">
      <h3 className="text-xl font-semibold mb-4 text-red-400">❌ Upload Failed</h3>
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
      <p className="mb-6 text-sm text-gray-400">
        Please ensure your audio file is under 200MB and in a supported format (WAV, FLAC, AIFF, MP3, AAC).
      </p>
      <Button 
        className="gradient-bg hover:opacity-90"
        onClick={onReset}
      >
        Try Again
      </Button>
    </div>
  );
};

export default UploadError;
