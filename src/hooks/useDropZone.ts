
import { useRef, useState, useCallback, useEffect } from "react";

interface UseDropZoneProps {
  onFileDrop: (file: File) => void;
  setIsDragging: (isDragging: boolean) => void;
  isDragging: boolean;
}

export const useDropZone = ({ onFileDrop, setIsDragging, isDragging }: UseDropZoneProps) => {
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging, setIsDragging]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
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
  }, [setIsDragging]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    try {
      const files = e.dataTransfer.files;
      
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
  }, [onFileDrop, setIsDragging]);

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

  return {
    dropZoneRef,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };
};
