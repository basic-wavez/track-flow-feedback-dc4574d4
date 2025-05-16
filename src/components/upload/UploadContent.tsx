
import React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadContentProps {
  isDragging: boolean;
  onButtonClick: (e: React.MouseEvent) => void;
}

const UploadContent = ({ isDragging, onButtonClick }: UploadContentProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <Upload className={`h-16 w-16 mb-4 text-wip-pink ${isDragging ? 'animate-bounce' : 'animate-pulse-glow'}`} />
      <h3 className="text-xl font-semibold mb-2">
        {isDragging ? "Drop Your Track Here" : "Drag & Drop Your Track"}
      </h3>
      <p className="text-gray-400 mb-4">
        Upload your new version
      </p>
      <p className="text-sm text-gray-500 mb-2">
        Supported formats: WAV, MP3, FLAC, AIFF
      </p>
      <p className="text-xs text-gray-500 mb-6">
        Maximum file size: 200MB
      </p>
      <Button 
        onClick={onButtonClick}
        className="bg-wip-pink hover:bg-wip-pink/90 text-white"
        type="button"
        aria-label="Select audio file from device"
      >
        Select Audio File
      </Button>
    </div>
  );
};

export default UploadContent;
