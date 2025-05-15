import { useState, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAllowedAudioFormat, isLosslessFormat, extractTrackName } from "@/lib/audioUtils";
import { uploadTrack } from "@/services/trackService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AudioUploaderProps {
  onUploadComplete: (trackId: string, trackName: string) => void;
  onAuthRequired: () => void;
}

const AudioUploader = ({ onUploadComplete, onAuthRequired }: AudioUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Maximum file size: 200MB (updated from 80MB)
  const MAX_FILE_SIZE = 200 * 1024 * 1024;

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const processUpload = async (file: File) => {
    try {
      // Reset error state
      setUploadError(null);
      
      if (!isAllowedAudioFormat(file)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an MP3, WAV, FLAC, AIFF, or AAC file.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size before attempting upload
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setUploadError(`File size exceeds the 200MB limit (your file: ${fileSizeMB}MB)`);
        return;
      }

      setFile(file);
      setUploading(true);

      // Check if it's MP3 and warn about quality loss
      if (file.type === 'audio/mpeg') {
        setShowQualityWarning(true);
        return; // Don't proceed until user confirms
      }

      await uploadFile(file);
    } catch (error) {
      setUploading(false);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const uploadFile = async (fileToUpload: File) => {
    try {
      setProgress(10);
      
      // If user is not logged in, require authentication
      if (!user) {
        setUploading(false);
        setProgress(0);
        onAuthRequired();
        return;
      }
      
      setProgress(30);
      
      // Upload to Supabase with progress tracking
      const trackName = extractTrackName(fileToUpload.name);
      const result = await uploadTrack(
        fileToUpload, 
        trackName,
        (uploadProgress) => {
          // Update progress based on chunked upload
          setProgress(30 + (uploadProgress * 0.6)); // Scale to 30-90% range
        }
      );
      
      setProgress(90);
      
      if (!result) {
        throw new Error("Upload failed");
      }
      
      setProgress(100);
      
      // Wait for progress to update visually before completing
      setTimeout(() => {
        // Reset upload state
        setUploading(false);
        setProgress(0);
        
        // Call upload complete callback with track ID and name
        onUploadComplete(result.id, result.title);
      }, 800);
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploading(false);
      setProgress(0);
      setUploadError(error.message || "There was an error processing your audio file.");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUpload(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleContinueAfterWarning = () => {
    setShowQualityWarning(false);
    if (file) {
      uploadFile(file);
    }
  };
  
  const resetUpload = () => {
    setFile(null);
    setUploadError(null);
    setUploading(false);
    setProgress(0);
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {!uploading && !showQualityWarning && !uploadError ? (
        <div
          className={`border-2 border-dashed rounded-lg p-12 transition-all ${
            isDragging 
              ? "border-wip-pink bg-wip-pink/10" 
              : "border-gray-600 hover:border-wip-pink hover:bg-wip-pink/5"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-16 w-16 mb-4 text-wip-pink animate-pulse-glow" />
            <h3 className="text-xl font-semibold mb-2">Drag & Drop Your Track</h3>
            <p className="text-gray-400 mb-4">
              Upload your work-in-progress track to get feedback
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Supported formats: MP3, WAV, FLAC, AIFF, AAC
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Maximum file size: 200MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button 
              onClick={handleUploadClick}
              className="gradient-bg hover:opacity-90"
            >
              Select Audio File
            </Button>
          </div>
        </div>
      ) : uploadError ? (
        <div className="border border-red-600 bg-red-600/20 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-4 text-red-400">❌ Upload Failed</h3>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
          <p className="mb-6 text-sm text-gray-400">
            Please ensure your audio file is under 200MB and in a supported format (WAV, FLAC, AIFF, MP3, AAC).
          </p>
          <Button 
            className="gradient-bg hover:opacity-90"
            onClick={resetUpload}
          >
            Try Again
          </Button>
        </div>
      ) : showQualityWarning ? (
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
              onClick={() => {
                setFile(null);
                setShowQualityWarning(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="gradient-bg hover:opacity-90"
              onClick={handleContinueAfterWarning}
            >
              Continue Anyway
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-wip-gray bg-wip-gray/20 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-4">Processing Your Track</h3>
          <p className="mb-4 text-gray-400">
            {file?.name}
          </p>
          <Progress value={progress} className="h-2 mb-4" />
          <p className="text-sm text-gray-500">
            {progress < 30 ? "Preparing upload..." : 
             progress < 50 ? "Creating upload..." :
             progress < 90 ? "Uploading to server..." : 
             "Almost done..."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
