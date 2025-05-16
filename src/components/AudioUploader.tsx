
import { useState, useCallback } from "react";
import { useAudioUpload } from "@/hooks/useAudioUpload";
import DropZone from "@/components/upload/DropZone";
import UploadStatus from "@/components/upload/UploadStatus";
import UploadError from "@/components/upload/UploadError";
import QualityWarning from "@/components/upload/QualityWarning";

interface AudioUploaderProps {
  onUploadComplete: (trackId: string, trackName: string) => void;
  onAuthRequired: () => void;
}

const AudioUploader = ({ onUploadComplete, onAuthRequired }: AudioUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    file,
    uploading,
    progress,
    showQualityWarning,
    uploadError,
    processingState,
    processUpload,
    handleContinueAfterWarning,
    resetUpload
  } = useAudioUpload({ onUploadComplete, onAuthRequired });

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        console.log("AudioUploader - File selected through button:", e.target.files[0].name);
        await processUpload(e.target.files[0]);
      }
    } catch (error) {
      console.error("AudioUploader - Error handling file selection:", error);
    }
  }, [processUpload]);

  const handleFileDrop = useCallback(async (droppedFile: File) => {
    try {
      await processUpload(droppedFile);
    } catch (error) {
      console.error("AudioUploader - Error handling file drop:", error);
    }
  }, [processUpload]);
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {!uploading && !showQualityWarning && !uploadError ? (
        <DropZone 
          onFileDrop={handleFileDrop}
          onFileSelect={handleFileSelect}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
        />
      ) : uploadError ? (
        <UploadError 
          errorMessage={uploadError}
          onReset={resetUpload}
        />
      ) : showQualityWarning ? (
        <QualityWarning 
          onCancel={() => resetUpload()}
          onContinue={handleContinueAfterWarning}
        />
      ) : (
        <UploadStatus
          fileName={file?.name || ''}
          progress={progress}
          processingState={processingState}
        />
      )}
    </div>
  );
};

export default AudioUploader;
