import { useRef, useState, useEffect, useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const DropZone = ({ onFileDrop, onFileSelect, isDragging, setIsDragging }: DropZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [dragEvents, setDragEvents] = useState<string[]>([]);
  
  // Helper function to log drag events (for debugging)
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
  }, [isDragging, logDragEvent, setIsDragging]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    logDragEvent('dragEnter');
    setIsDragging(true);
  }, [logDragEvent, setIsDragging]);

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
  }, [logDragEvent, setIsDragging]);

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
      
      console.log("DropZone - Drop event detected with files:", files.length);
      
      if (!files || files.length === 0) {
        console.error("DropZone - No files found in drop event");
        return;
      }
      
      // Important: Clone the file to ensure we're working with a fully initialized File object
      const droppedFile = files[0];
      
      console.log("DropZone - Dropped file details:", {
        name: droppedFile.name,
        type: droppedFile.type,
        size: droppedFile.size,
        lastModified: new Date(droppedFile.lastModified).toISOString()
      });
      
      // Pass the file to the parent component
      onFileDrop(droppedFile);
    } catch (error) {
      console.error("DropZone - Error handling file drop:", error);
    }
  }, [logDragEvent, onFileDrop, setIsDragging]);

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

    console.log("DropZone - Global drag event listeners added");

    return () => {
      // Remove global event handlers on cleanup
      window.removeEventListener('dragenter', preventDefaults);
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('dragleave', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  return (
    <>
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
            onChange={onFileSelect}
          />
          <Button 
            onClick={handleButtonClick}
            className="gradient-bg hover:opacity-90"
            type="button"
            aria-label="Select audio file from device"
          >
            Select Audio File
          </Button>
        </div>
      </div>
      
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
    </>
  );
};

export default DropZone;
