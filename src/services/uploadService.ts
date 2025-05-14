
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";

// Constants for chunked uploads
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
export const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB maximum file size

interface UploadProgress {
  totalChunks: number;
  currentChunk: number;
  progress: number; // 0-100
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  compressedUrl: string;
  totalChunks: number;
}

/**
 * Uploads a file in chunks to Supabase Storage
 */
export const uploadFileInChunks = async (
  file: File,
  uniquePath: string,
  bucketName: string = 'audio',
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  // Track upload progress
  const progress: UploadProgress = {
    totalChunks: 0,
    currentChunk: 0,
    progress: 0,
    onProgress
  };

  // Calculate total chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  progress.totalChunks = totalChunks;

  try {
    // For small files (< 5MB), upload directly
    if (file.size <= CHUNK_SIZE) {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(uniquePath, file);

      if (error) throw error;

      // Get the URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uniquePath);

      if (progress.onProgress) {
        progress.onProgress(100);
      }

      return { compressedUrl: publicUrl, totalChunks: 1 };
    }

    // True chunked upload implementation for larger files
    // Create an array buffer from the file
    const fileBuffer = await file.arrayBuffer();
    const fileUint8 = new Uint8Array(fileBuffer);
    
    // Initialize temporary chunk paths
    const chunkPaths: string[] = [];
    
    // Upload each chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkData = fileUint8.slice(start, end);
      const chunkBlob = new Blob([chunkData]);
      
      const chunkPath = `${uniquePath}_chunk_${i}`;
      chunkPaths.push(chunkPath);
      
      progress.currentChunk = i + 1;
      
      // Upload the chunk
      const { error: chunkError } = await supabase.storage
        .from(bucketName)
        .upload(chunkPath, chunkBlob);
      
      if (chunkError) {
        // Clean up already uploaded chunks on error
        await Promise.all(
          chunkPaths.map(path => 
            supabase.storage.from(bucketName).remove([path])
          )
        );
        throw chunkError;
      }
      
      // Update progress
      const chunkProgress = Math.floor((i + 1) / totalChunks * 100);
      if (progress.onProgress) {
        progress.onProgress(chunkProgress);
      }
    }
    
    // All chunks uploaded successfully
    
    // Get the URL of the first chunk
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(chunkPaths[0]);
    
    return {
      compressedUrl: publicUrl,
      totalChunks: totalChunks
    };
  } catch (error: any) {
    // Handle specific Supabase error codes
    if (error.statusCode === 413) {
      throw new Error('Payload too large: The file is too large for the server to process.');
    } else if (error.message && typeof error.message === 'string' && error.message.includes('size')) {
      throw new Error(`File size exceeds limit: ${(file.size / (1024 * 1024)).toFixed(1)}MB is too large.`);
    }
    throw error;
  }
};

/**
 * Validates that a file size is within acceptable limits
 */
export const validateFileSize = (file: File): void => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit (your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
  }
};
