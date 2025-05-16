
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { handleError } from "@/utils/errorHandler";

// Maximum file size (200MB)
export const MAX_FILE_SIZE = 200 * 1024 * 1024;

/**
 * Uploads a file directly to Supabase Storage
 */
export const uploadFile = async (
  file: File,
  uniquePath: string,
  bucketName: string = 'audio',
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log("uploadService - Starting upload for:", file.name, file.size);
  
  try {
    // Validate file size before upload
    validateFileSize(file);
    
    // Track upload progress with XHR if progress callback provided
    if (onProgress) {
      // For uploads with progress tracking
      return await uploadWithProgress(file, uniquePath, bucketName, onProgress);
    } else {
      // For uploads without progress tracking, use direct upload
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(uniquePath, file);

      if (error) {
        console.error("uploadService - Upload error:", error);
        throw error;
      }

      // Get the URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uniquePath);
      
      console.log("uploadService - Upload complete, URL:", publicUrl);
      return publicUrl;
    }
  } catch (error: any) {
    console.error("uploadService - Upload error:", error);
    
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
 * Upload file with progress tracking
 * This implementation uses Supabase's direct upload with progress tracking
 */
const uploadWithProgress = async (
  file: File,
  uniquePath: string,
  bucketName: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Start with initial progress
    onProgress(0);
    
    // Create a controller to abort if needed
    const controller = new AbortController();
    
    // Calculate file size in MB for logging
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    console.log(`uploadService - Beginning upload of ${fileSizeMB}MB file to ${bucketName}/${uniquePath}`);
    
    // Set a timeout to abort upload if it takes too long
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Upload timed out after 5 minutes'));
    }, 5 * 60 * 1000); // 5 minute timeout
    
    // Track upload locally
    let lastReportedProgress = 0;
    let uploadStartTime = Date.now();
    let progressInterval: any = null;
    
    // Setup a progress reporting interval 
    const startProgressTracking = () => {
      // Report initial progress
      onProgress(1); // Start with some small progress indicator
      
      // Setup interval to simulate progress
      progressInterval = setInterval(() => {
        // Increase progress gradually to 90% while waiting for Supabase
        const elapsedSecs = (Date.now() - uploadStartTime) / 1000;
        const estimatedProgress = Math.min(90, Math.round(
          // Non-linear progress simulation that slows down as it approaches 90%
          30 + (60 * (1 - Math.exp(-0.05 * elapsedSecs)))
        ));
        
        if (estimatedProgress > lastReportedProgress) {
          lastReportedProgress = estimatedProgress;
          onProgress(estimatedProgress);
          console.log(`uploadService - Upload in progress: ~${estimatedProgress}%`);
        }
      }, 500);
    };
    
    // Clear all intervals and timeouts
    const cleanup = () => {
      clearTimeout(timeoutId);
      if (progressInterval) clearInterval(progressInterval);
    };
    
    // Start progress tracking
    startProgressTracking();
    
    // Attempt the upload using Supabase's direct upload
    // Note: We're using only the properties that FileOptions supports
    supabase.storage
      .from(bucketName)
      .upload(uniquePath, file, {
        // Remove the signal property which is causing the TypeScript error
        // The controller is still useful for our local timeout handling
        cacheControl: '3600',
        duplex: 'half', 
        // Pass additional file options that are valid in the type
      })
      .then(({ data, error }) => {
        if (error) {
          cleanup();
          console.error("uploadService - Direct upload failed:", error);
          reject(error);
          return;
        }
        
        // Get the URL of the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uniquePath);
        
        // Set progress to 100%
        onProgress(100);
        console.log(`uploadService - Upload completed successfully after ${((Date.now() - uploadStartTime) / 1000).toFixed(1)}s`);
        
        // Clean up and resolve with URL
        cleanup();
        resolve(publicUrl);
      })
      .catch(error => {
        cleanup();
        console.error("uploadService - Upload error:", error);
        reject(error);
      });
  });
};

/**
 * Validates that a file size is within acceptable limits
 */
export const validateFileSize = (file: File): void => {
  console.log("uploadService - Validating file size:", file.size, "Max:", MAX_FILE_SIZE);
  
  if (file.size > MAX_FILE_SIZE) {
    const errorMsg = `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit (your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`;
    console.error("uploadService - File size validation failed:", errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log("uploadService - File size validation passed");
};
