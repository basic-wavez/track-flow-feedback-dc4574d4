import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAllowedAudioFormat, isLosslessFormat, extractTrackName } from "@/lib/audioUtils";
import { uploadTrack } from "@/services/trackService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { handleError } from "@/utils/errorHandler";

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
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [processingState, setProcessingState] = useState<string>('');
  const [dragEvents, setDragEvents] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, refreshSession } = useAuth();
  
  // Maximum file size: 200MB
  const MAX_FILE_SIZE = 200 * 1024 * 1024;

  // Add an effect to log authentication state when component mounts and when auth state changes
  useEffect(() => {
    console.log("AudioUploader - Auth state:", { 
      isAuthenticated: !!user, 
      userId: user?.id,
      email: user?.email
    });
  }, [user]);

  // Add effect to monitor drag event debug info
  useEffect(() => {
    if (dragEvents.length > 0) {
      console.log("AudioUploader - Recent drag events:", dragEvents);
    }
  }, [dragEvents]);

  // Helper function to log drag events
  const logDragEvent = useCallback((eventName: string, details?: any) => {
    setDragEvents(prev => {
      const updated = [...prev, `${eventName} at ${new Date().toISOString()}${details ? ' - ' + JSON.stringify(details) : ''}`];
      // Keep only the last 5 events
      return updated.slice(Math.max(updated.length - 5, 0));
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    logDragEvent('dragOver');
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging, logDragEvent]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    logDragEvent('dragEnter');
    setIsDragging(true);
  }, [logDragEvent]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    logDragEvent('dragLeave');
    
    // Check if the drag leave event is leaving the drop zone
    // and not just entering a child element
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX >= rect.right ||
        clientY < rect.top ||
        clientY >= rect.bottom
      ) {
        setIsDragging(false);
      }
    } else {
      setIsDragging(false);
    }
  }, [logDragEvent]);

  const checkAuthBeforeUpload = async () => {
    try {
      setCheckingAuth(true);
      setProcessingState('Checking authentication...');
      console.log("AudioUploader - Starting authentication check");
      
      // Refresh the session to ensure we have the latest auth state
      await refreshSession();
      
      // Log the current authentication state after refresh
      console.log("AudioUploader - Auth check result:", {
        isAuthenticated: !!user,
        userId: user?.id,
        email: user?.email
      });
      
      // If after refresh we still don't have a user, trigger auth modal
      if (!user) {
        console.log("AudioUploader - User not authenticated, showing auth modal");
        onAuthRequired();
        return false;
      }
      
      console.log("AudioUploader - User is authenticated, proceeding with upload");
      return true;
    } catch (error) {
      console.error("AudioUploader - Error checking authentication:", error);
      toast({
        title: "Authentication Error",
        description: "There was a problem verifying your account. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setCheckingAuth(false);
    }
  };

  const processUpload = async (file: File) => {
    try {
      // Reset error state
      setUploadError(null);
      setProcessingState('Validating file...');
      console.log("AudioUploader - Processing file:", file.name, file.type, file.size);
      
      if (!isAllowedAudioFormat(file)) {
        const errorMsg = `Invalid file type: ${file.type}. Please upload an MP3, WAV, FLAC, AIFF, or AAC file.`;
        console.error("AudioUploader - " + errorMsg);
        toast({
          title: "Invalid File Type",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
      
      // Check file size before attempting upload
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const errorMsg = `File size exceeds the 200MB limit (your file: ${fileSizeMB}MB)`;
        console.error("AudioUploader - " + errorMsg);
        setUploadError(errorMsg);
        return;
      }

      // Check authentication before proceeding further
      setProcessingState('Checking authentication...');
      const isAuthenticated = await checkAuthBeforeUpload();
      if (!isAuthenticated) {
        console.log("AudioUploader - Authentication check failed, stopping upload process");
        return;
      }

      setFile(file);
      
      // Check if it's MP3 and warn about quality loss
      if (file.type === 'audio/mpeg') {
        console.log("AudioUploader - MP3 file detected, showing quality warning");
        setShowQualityWarning(true);
        return; // Don't proceed until user confirms
      }

      setProcessingState('Starting upload...');
      await uploadFile(file);
    } catch (error) {
      console.error("AudioUploader - Upload preparation error:", error);
      setUploading(false);
      setUploadError(error instanceof Error ? error.message : "Upload preparation failed");
      handleError(error, "Upload Error", "There was a problem processing your audio file");
    }
  };

  const uploadFile = async (fileToUpload: File) => {
    try {
      console.log("AudioUploader - Starting file upload for:", fileToUpload.name);
      setUploading(true);
      setProgress(10);
      
      // Double-check authentication is valid
      setProcessingState('Verifying authentication...');
      const isAuthenticated = await checkAuthBeforeUpload();
      if (!isAuthenticated) {
        console.log("AudioUploader - Final authentication check failed before upload");
        setUploading(false);
        setProgress(0);
        return;
      }
      
      setProgress(30);
      setProcessingState('Uploading to server...');
      
      // Upload to Supabase with progress tracking
      const trackName = extractTrackName(fileToUpload.name);
      console.log("AudioUploader - Calling uploadTrack service with file:", {
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type,
        trackName: trackName
      });
      
      const result = await uploadTrack(
        fileToUpload, 
        trackName,
        (uploadProgress) => {
          // Update progress based on chunked upload
          const newProgress = 30 + (uploadProgress * 0.6);
          setProgress(newProgress);
          setProcessingState(`Uploading: ${Math.round(uploadProgress)}%`);
          console.log("AudioUploader - Upload progress:", uploadProgress, "Combined progress:", newProgress);
        }
      );
      
      console.log("AudioUploader - Upload result:", result);
      setProcessingState('Processing upload...');
      setProgress(90);
      
      if (!result) {
        throw new Error("Upload service returned no result");
      }
      
      setProgress(100);
      setProcessingState('Upload complete!');
      
      // Wait for progress to update visually before completing
      setTimeout(() => {
        // Reset upload state
        setUploading(false);
        setProgress(0);
        
        console.log("AudioUploader - Upload complete, calling onUploadComplete with:", result.id, result.title);
        // Call upload complete callback with track ID and name
        onUploadComplete(result.id, result.title);
      }, 800);
    } catch (error: any) {
      console.error("AudioUploader - Upload error:", error);
      setUploading(false);
      setProgress(0);
      setProcessingState('');
      setUploadError(error.message || "There was an error processing your audio file.");
      handleError(error, "Upload Failed", "There was a problem uploading your audio file");
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    try {
      const files = e.dataTransfer.files;
      
      logDragEvent('drop', { 
        fileCount: files.length, 
        fileInfo: files.length > 0 ? {
          name: files[0].name,
          type: files[0].type,
          size: files[0].size
        } : 'No files'
      });
      
      console.log("AudioUploader - Drop event detected with files:", files.length);
      
      if (!files || files.length === 0) {
        console.error("AudioUploader - No files found in drop event");
        toast({
          title: "Upload Error",
          description: "No files were detected in the drop. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Access the file before the auth check to validate it's accessible
      const droppedFile = files[0];
      console.log("AudioUploader - Dropped file details:", {
        name: droppedFile.name,
        type: droppedFile.type,
        size: droppedFile.size,
        lastModified: new Date(droppedFile.lastModified).toISOString()
      });
      
      // Now proceed with processing the file
      await processUpload(droppedFile);
    } catch (error) {
      console.error("AudioUploader - Error handling file drop:", error);
      setUploadError(error instanceof Error ? error.message : "Error accessing dropped file");
      toast({
        title: "Upload Error",
        description: "There was a problem processing the dropped file.",
        variant: "destructive",
      });
    }
  }, [logDragEvent, processUpload, toast]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        console.log("AudioUploader - File selected through button:", e.target.files[0].name);
        await processUpload(e.target.files[0]);
      }
    } catch (error) {
      console.error("AudioUploader - Error handling file selection:", error);
      setUploadError(error instanceof Error ? error.message : "Error accessing selected file");
      toast({
        title: "Upload Error",
        description: "There was a problem processing the selected file.",
        variant: "destructive",
      });
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default to avoid any bubbling issues
    if (fileInputRef.current) {
      console.log("AudioUploader - Upload button clicked, opening file dialog");
      fileInputRef.current.click();
    }
  };

  const handleContinueAfterWarning = async () => {
    setShowQualityWarning(false);
    if (file) {
      // Check authentication before continuing
      const isAuthenticated = await checkAuthBeforeUpload();
      if (isAuthenticated) {
        uploadFile(file);
      }
    }
  };
  
  const resetUpload = () => {
    setFile(null);
    setUploadError(null);
    setUploading(false);
    setProgress(0);
    setProcessingState('');
  };
  
  // Add an effect to set up global drag-and-drop event handlers
  useEffect(() => {
    // Prevent default behavior to ensure our handlers work properly
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add global event handlers
    window.addEventListener('dragenter', preventDefaults, false);
    window.addEventListener('dragover', preventDefaults, false);
    window.addEventListener('dragleave', preventDefaults, false);
    window.addEventListener('drop', preventDefaults, false);

    console.log("AudioUploader - Global drag event listeners added");

    return () => {
      // Remove global event handlers on cleanup
      window.removeEventListener('dragenter', preventDefaults);
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('dragleave', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {!uploading && !showQualityWarning && !uploadError ? (
        <div
          ref={dropZoneRef}
          className={`border-2 border-dashed rounded-lg p-12 transition-all cursor-pointer ${
            isDragging 
              ? "border-wip-pink bg-wip-pink/10" 
              : "border-gray-600 hover:border-wip-pink hover:bg-wip-pink/5"
          }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
          data-testid="dropzone"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className={`h-16 w-16 mb-4 text-wip-pink ${isDragging ? 'animate-bounce' : 'animate-pulse-glow'}`} />
            <h3 className="text-xl font-semibold mb-2">
              {isDragging ? "Drop Your Track Here" : "Drag & Drop Your Track"}
            </h3>
            <p className="text-gray-400 mb-4">
              Upload your demo to get feedback
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
            {processingState || (checkingAuth ? "Verifying authentication..." : 
             progress < 30 ? "Preparing upload..." : 
             progress < 50 ? "Creating upload..." :
             progress < 90 ? "Uploading to server..." : 
             "Almost done...")}
          </p>
        </div>
      )}
      
      {/* Debug Info - only visible during development */}
      {process.env.NODE_ENV === 'development' && dragEvents.length > 0 && (
        <div className="mt-4 p-4 bg-gray-800 rounded text-xs">
          <h4 className="font-semibold mb-2">Drag Event Log:</h4>
          <ul>
            {dragEvents.map((event, i) => (
              <li key={i}>{event}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
