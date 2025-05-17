
import { useState, useCallback } from "react";
import { useAudioUpload } from "@/hooks/useAudioUpload";
import UploadContent from "@/components/upload/UploadContent";
import UploadStatus from "@/components/upload/UploadStatus";
import UploadError from "@/components/upload/UploadError";
import QualityWarning from "@/components/upload/QualityWarning";

interface AudioUploaderProps {
  onUploadComplete: (trackId: string, trackName: string) => void;
  onAuthRequired: () => void;
}

const AudioUploader = ({ onUploadComplete, onAuthRequired }: AudioUploaderProps) => {
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
        console.log("AudioUploader - File selected:", e.target.files[0].name);
        await processUpload(e.target.files[0]);
      }
    } catch (error) {
      console.error("AudioUploader - Error handling file selection:", error);
    }
  }, [processUpload]);
  
  // Handler for button click to open file dialog
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Create a hidden file input and trigger it
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        try {
          await processUpload(target.files[0]);
        } catch (error) {
          console.error("AudioUploader - Error processing selected file:", error);
        }
      }
    });
    
    // Append to body, click and then remove
    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => {
      document.body.removeChild(fileInput);
    }, 500);
  }, [processUpload]);
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {!uploading && !showQualityWarning && !uploadError ? (
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 transition-all">
          <UploadContent 
            onButtonClick={handleButtonClick}
          />
        </div>
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
