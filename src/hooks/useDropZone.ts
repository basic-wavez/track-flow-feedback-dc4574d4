
import { useRef, useState, useCallback, useEffect } from "react";

interface FileRejection {
  file: File;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

interface UseDropZoneOptions {
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
}

interface UseDropZoneProps {
  onFileDrop: (file: File) => void;
  setIsDragging?: (isDragging: boolean) => void;
  isDragging?: boolean;
}

// Maximum file size: 200MB - matching our other files
const MAX_FILE_SIZE = 200 * 1024 * 1024;

export const useDropZone = ({ onFileDrop, setIsDragging, isDragging = false }: UseDropZoneProps) => {
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);
  const [fileRejections, setFileRejections] = useState<FileRejection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging && setIsDragging) {
      setIsDragging(true);
    }
    setIsDragActive(true);
  }, [isDragging, setIsDragging]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (setIsDragging) setIsDragging(true);
    setIsDragActive(true);
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
        if (setIsDragging) setIsDragging(false);
        setIsDragActive(false);
      }
    } else {
      if (setIsDragging) setIsDragging(false);
      setIsDragActive(false);
    }
  }, [setIsDragging]);

  const validateFile = useCallback((file: File, options?: UseDropZoneOptions): { valid: boolean; error?: string } => {
    // Check file type if specified
    if (options?.acceptedFileTypes && options.acceptedFileTypes.length > 0) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!options.acceptedFileTypes.includes(fileExtension)) {
        return { 
          valid: false, 
          error: `File type not accepted. Please use: ${options.acceptedFileTypes.join(', ')}` 
        };
      }
    }
    
    // Check file size against our 200MB limit
    const maxSizeBytes = (options?.maxFileSizeMB || 200) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${options?.maxFileSizeMB || 200}MB.` 
      };
    }
    
    return { valid: true };
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, options?: UseDropZoneOptions) => {
    e.preventDefault();
    e.stopPropagation();
    if (setIsDragging) setIsDragging(false);
    setIsDragActive(false);
    
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
      
      // Validate file if options provided
      if (options) {
        const validation = validateFile(droppedFile, options);
        if (!validation.valid) {
          setError(validation.error || "Invalid file");
          setFileRejections([{
            file: droppedFile,
            errors: [{ code: "invalid-file", message: validation.error || "Invalid file" }]
          }]);
          return;
        }
      }
      
      // Add to accepted files
      setAcceptedFiles([droppedFile]);
      setFileRejections([]);
      setError(null);
      
      // Pass the file to the parent component
      onFileDrop(droppedFile);
    } catch (error) {
      console.error("DropZone - Error handling file drop:", error);
      setError("Error processing file");
    }
  }, [onFileDrop, setIsDragging, validateFile]);

  // Add methods to simulate react-dropzone API
  const getRootProps = () => ({
    ref: dropZoneRef,
    onDragOver: handleDragOver,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: (e: React.DragEvent<HTMLDivElement>) => handleDrop(e),
  });

  const getInputProps = () => ({
    accept: "audio/*",
    multiple: false,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setAcceptedFiles([file]);
        onFileDrop(file);
      }
    }
  });

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
    handleDrop,
    // Add react-dropzone style API
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
    fileRejections,
    error
  };
};
