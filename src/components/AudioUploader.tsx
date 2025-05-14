import { useState, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAllowedAudioFormat, isLosslessFormat, extractTrackName, compressAudioFile } from "@/lib/audioUtils";

interface AudioUploaderProps {
  onUploadComplete: (fileName: string, trackName: string) => void;
  onAuthRequired: () => void;
}

const AudioUploader = ({ onUploadComplete, onAuthRequired }: AudioUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const processUpload = async (file: File) => {
    try {
      if (!isAllowedAudioFormat(file)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an MP3, WAV, FLAC, AIFF, or AAC file.",
          variant: "destructive",
        });
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
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const uploadFile = async (fileToUpload: File) => {
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // Compress the file if needed
      const compressionResult = await compressAudioFile(fileToUpload);
      
      if (!compressionResult.success) {
        throw new Error("Compression failed");
      }

      // Complete the upload simulation
      clearInterval(interval);
      setProgress(100);
      
      // Wait for progress to update visually before completing
      setTimeout(() => {
        const trackName = extractTrackName(fileToUpload.name);
        setUploading(false);
        setProgress(0);
        
        // Call onUploadComplete callback with file info
        onUploadComplete(fileToUpload.name, trackName);
        
        // Only require authentication if the user is not logged in
        if (!user) {
          setTimeout(() => {
            onAuthRequired();
          }, 100);
        }
      }, 500);
    } catch (error) {
      clearInterval(interval);
      setUploading(false);
      setProgress(0);
      
      toast({
        title: "Processing Failed",
        description: "There was an error processing your audio file.",
        variant: "destructive",
      });
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
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {!uploading && !showQualityWarning ? (
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
            <p className="text-sm text-gray-500 mb-6">
              Supported formats: MP3, WAV, FLAC, AIFF, AAC
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
            {progress < 50 ? "Analyzing audio..." : 
             progress < 90 ? "Optimizing file..." : 
             "Almost done..."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
