
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
      // For uploads with progress tracking, use XHR
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
 * Upload file with progress tracking using XHR
 */
const uploadWithProgress = (
  file: File,
  uniquePath: string,
  bucketName: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Get the upload URL from Supabase
    supabase.storage.from(bucketName).getUploadUrl(uniquePath)
      .then(({ data, error }) => {
        if (error) {
          console.error("uploadService - Failed to get upload URL:", error);
          reject(error);
          return;
        }
        
        const { url, token } = data;
        const formData = new FormData();
        formData.append('file', file);
        
        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            console.log(`uploadService - Upload progress: ${percentComplete}%`);
            onProgress(percentComplete);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log("uploadService - XHR upload successful");
            // Get the public URL for the uploaded file
            const { data } = supabase.storage
              .from(bucketName)
              .getPublicUrl(uniquePath);
            
            resolve(data.publicUrl);
          } else {
            console.error("uploadService - XHR upload failed:", xhr.statusText);
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          console.error("uploadService - XHR upload error");
          reject(new Error('Network error during upload'));
        };
        
        xhr.open('POST', url);
        xhr.setRequestHeader('authorization', `Bearer ${token}`);
        xhr.send(formData);
      })
      .catch(error => {
        console.error("uploadService - Error getting upload URL:", error);
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
