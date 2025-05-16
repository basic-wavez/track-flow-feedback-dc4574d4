
import { useRef, useCallback } from "react";
import { useDropZone } from "@/hooks/useDropZone";
import UploadContent from "./UploadContent";

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const DropZone = ({ onFileDrop, onFileSelect, isDragging, setIsDragging }: DropZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    dropZoneRef,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  } = useDropZone({
    onFileDrop,
    isDragging,
    setIsDragging
  });
  
  // Separate handler specifically for button click
  const handleButtonClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent the general dropzone click handler from firing
    e.preventDefault();
    e.stopPropagation();
    
    console.log("DropZone - Button click handler triggered");
    
    // Use a small timeout to ensure the click event is fully processed
    // before trying to open the file dialog
    setTimeout(() => {
      if (fileInputRef.current) {
        console.log("DropZone - Opening file dialog after button click");
        fileInputRef.current.click();
      }
    }, 50);
  };
  
  // Handler for clicking on the general dropzone area
  const handleDropZoneClick = (e: React.MouseEvent) => {
    // Only open file dialog if the click is directly on the dropzone
    // (not on the button which has its own handler)
    if (e.target === e.currentTarget || e.currentTarget.contains(e.target as Node)) {
      console.log("DropZone - Dropzone click handler triggered");
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  return (
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
      onClick={handleDropZoneClick}
      data-testid="dropzone"
    >
      <UploadContent 
        isDragging={isDragging}
        onButtonClick={handleButtonClick}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={onFileSelect}
      />
    </div>
  );
};

export default DropZone;
