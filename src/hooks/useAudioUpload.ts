
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { isAllowedAudioFormat, extractTrackName } from "@/lib/audioUtils";
import { uploadTrack } from "@/services/trackService";
import { handleError } from "@/utils/errorHandler";

// Maximum file size: 200MB
const MAX_FILE_SIZE = 200 * 1024 * 1024;

interface UseAudioUploadProps {
  onUploadComplete: (trackId: string, trackName: string) => void;
  onAuthRequired: () => void;
}

export const useAudioUpload = ({ 
  onUploadComplete, 
  onAuthRequired 
}: UseAudioUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [processingState, setProcessingState] = useState<string>('');
  
  const { toast } = useToast();
  const { user, refreshSession } = useAuth();

  // Check authentication before upload
  const checkAuthBeforeUpload = async () => {
    try {
      setCheckingAuth(true);
      setProcessingState('Checking authentication...');
      console.log("useAudioUpload - Starting authentication check");
      
      // Refresh the session to ensure we have the latest auth state
      await refreshSession();
      
      // Log the current authentication state after refresh
      console.log("useAudioUpload - Auth check result:", {
        isAuthenticated: !!user,
        userId: user?.id,
        email: user?.email
      });
      
      // If after refresh we still don't have a user, trigger auth modal
      if (!user) {
        console.log("useAudioUpload - User not authenticated, showing auth modal");
        onAuthRequired();
        return false;
      }
      
      console.log("useAudioUpload - User is authenticated, proceeding with upload");
      return true;
    } catch (error) {
      console.error("useAudioUpload - Error checking authentication:", error);
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

  // Process the file before uploading
  const processUpload = async (file: File) => {
    try {
      // Reset error state
      setUploadError(null);
      setProcessingState('Validating file...');
      console.log("useAudioUpload - Processing file:", file.name, file.type, file.size);
      
      if (!isAllowedAudioFormat(file)) {
        const errorMsg = `Invalid file type: ${file.type}. Please upload an MP3, WAV, FLAC, AIFF, or AAC file.`;
        console.error("useAudioUpload - " + errorMsg);
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
        console.error("useAudioUpload - " + errorMsg);
        setUploadError(errorMsg);
        return;
      }

      // Check authentication before proceeding further
      setProcessingState('Checking authentication...');
      const isAuthenticated = await checkAuthBeforeUpload();
      if (!isAuthenticated) {
        console.log("useAudioUpload - Authentication check failed, stopping upload process");
        return;
      }

      setFile(file);
      
      // Check if it's MP3 and warn about quality loss
      if (file.type === 'audio/mpeg') {
        console.log("useAudioUpload - MP3 file detected, showing quality warning");
        setShowQualityWarning(true);
        return; // Don't proceed until user confirms
      }

      setProcessingState('Starting upload...');
      await uploadFile(file);
    } catch (error) {
      console.error("useAudioUpload - Upload preparation error:", error);
      setUploading(false);
      setUploadError(error instanceof Error ? error.message : "Upload preparation failed");
      handleError(error, "Upload Error", "There was a problem processing your audio file");
    }
  };

  // Upload the file to the server
  const uploadFile = async (fileToUpload: File) => {
    try {
      console.log("useAudioUpload - Starting file upload for:", fileToUpload.name);
      setUploading(true);
      setProgress(10);
      
      // Double-check authentication is valid
      setProcessingState('Verifying authentication...');
      const isAuthenticated = await checkAuthBeforeUpload();
      if (!isAuthenticated) {
        console.log("useAudioUpload - Final authentication check failed before upload");
        setUploading(false);
        setProgress(0);
        return;
      }
      
      setProgress(30);
      setProcessingState('Uploading to server...');
      
      // Upload to Supabase with progress tracking
      const trackName = extractTrackName(fileToUpload.name);
      console.log("useAudioUpload - Calling uploadTrack service with file:", {
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type,
        trackName: trackName
      });
      
      const result = await uploadTrack(
        fileToUpload, 
        trackName,
        (uploadProgress) => {
          // Update progress based on upload
          const newProgress = 30 + (uploadProgress * 0.6);
          setProgress(newProgress);
          setProcessingState(`Uploading: ${Math.round(uploadProgress)}%`);
          console.log("useAudioUpload - Upload progress:", uploadProgress, "Combined progress:", newProgress);
        }
      );
      
      console.log("useAudioUpload - Upload result:", result);
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
        
        console.log("useAudioUpload - Upload complete, calling onUploadComplete with:", result.id, result.title);
        // Call upload complete callback with track ID and name
        onUploadComplete(result.id, result.title);
      }, 800);
    } catch (error: any) {
      console.error("useAudioUpload - Upload error:", error);
      setUploading(false);
      setProgress(0);
      setProcessingState('');
      setUploadError(error.message || "There was an error processing your audio file.");
      handleError(error, "Upload Failed", "There was a problem uploading your audio file");
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

  return {
    file,
    uploading,
    progress,
    showQualityWarning,
    uploadError,
    checkingAuth,
    processingState,
    processUpload,
    uploadFile,
    handleContinueAfterWarning,
    resetUpload
  };
};
