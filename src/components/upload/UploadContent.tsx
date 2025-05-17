
import React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadContentProps {
  onButtonClick: (e: React.MouseEvent) => void;
}

const UploadContent = ({ onButtonClick }: UploadContentProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <Upload className="h-16 w-16 mb-4 text-wip-pink animate-pulse-glow" />
      <h3 className="text-xl font-semibold mb-2">
        Share your demo
      </h3>
      <p className="text-gray-400 mb-6">
        Upload your demo to get feedback
      </p>
      <p className="text-sm text-gray-500 mb-2">
        Supported formats: MP3, WAV, FLAC, AIFF, AAC
      </p>
      <p className="text-xs text-gray-500 mb-6">
        Maximum file size: 200MB
      </p>
      <Button 
        onClick={onButtonClick}
        className="gradient-bg hover:opacity-90 px-8 py-6 text-base"
        type="button"
        aria-label="Select audio file from device"
      >
        Select Audio File
      </Button>
    </div>
  );
};

export default UploadContent;
