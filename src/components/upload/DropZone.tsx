
import { useRef } from "react";
import UploadContent from "./UploadContent";

interface DropZoneProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onButtonClick: (e: React.MouseEvent) => void;
}

const DropZone = ({ onFileSelect, onButtonClick }: DropZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <UploadContent 
        onButtonClick={onButtonClick}
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
