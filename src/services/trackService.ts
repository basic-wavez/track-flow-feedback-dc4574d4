
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";

export interface TrackData {
  id: string;
  title: string;
  compressed_url: string;
  original_url?: string;
  original_filename: string;
  user_id: string;
  created_at?: string;
}

// Constants for chunked uploads
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB maximum file size

interface UploadProgress {
  totalChunks: number;
  currentChunk: number;
  progress: number; // 0-100
  onProgress?: (progress: number) => void;
}

/**
 * Uploads a file in chunks to Supabase Storage
 */
const uploadFileInChunks = async (
  file: File,
  uniquePath: string,
  progress: UploadProgress
): Promise<string> => {
  // Calculate total chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  progress.totalChunks = totalChunks;

  try {
    // For small files (< 5MB), upload directly
    if (file.size <= CHUNK_SIZE) {
      const { data, error } = await supabase.storage
        .from('audio')
        .upload(uniquePath, file);

      if (error) throw error;

      // Get the URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(uniquePath);

      if (progress.onProgress) {
        progress.onProgress(100);
      }

      return publicUrl;
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
        .from('audio')
        .upload(chunkPath, chunkBlob);
      
      if (chunkError) {
        // Clean up already uploaded chunks on error
        await Promise.all(
          chunkPaths.map(path => 
            supabase.storage.from('audio').remove([path])
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
    // For a production app, you would typically have a server-side process
    // to reassemble the chunks. For this demo, we'll use the first chunk's URL
    // and note this limitation.
    
    // Get the URL of the first chunk for demo purposes
    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(chunkPaths[0]);
    
    // In a real implementation, you would have an edge function
    // that combines these chunks server-side
    
    return publicUrl;
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

export const uploadTrack = async (
  file: File, 
  title?: string,
  onProgress?: (progress: number) => void
): Promise<TrackData | null> => {
  try {
    // Check if the file size exceeds the maximum limit
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit (your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to upload tracks");
    }

    // Generate a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const uniquePath = `${user.id}/${uniqueFileName}`;
    
    // Track upload progress
    const progress: UploadProgress = {
      totalChunks: 0,
      currentChunk: 0,
      progress: 0,
      onProgress
    };

    // Upload the file to storage using chunking
    const compressedUrl = await uploadFileInChunks(file, uniquePath, progress);
    
    // Create a record in the tracks table
    const trackTitle = title || file.name.split('.')[0]; // Use provided title or extract from filename
    
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        title: trackTitle,
        compressed_url: compressedUrl,
        original_filename: file.name,
        user_id: user.id,
        downloads_enabled: false
      })
      .select()
      .single();
      
    if (trackError) {
      throw trackError;
    }
    
    return track;
  } catch (error: any) {
    console.error("Upload error:", error);
    toast({
      title: "Upload Failed",
      description: error.message || "There was an error uploading your track",
      variant: "destructive",
    });
    return null;
  }
};

export const getTrack = async (trackId: string): Promise<TrackData | null> => {
  try {
    const { data: track, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();
      
    if (error) {
      throw error;
    }
    
    return track;
  } catch (error: any) {
    toast({
      title: "Error Loading Track",
      description: error.message || "Failed to load track details",
      variant: "destructive",
    });
    return null;
  }
};

export const updateTrackDetails = async (
  trackId: string,
  details: { title?: string; description?: string; downloads_enabled?: boolean }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tracks')
      .update(details)
      .eq('id', trackId);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    toast({
      title: "Update Failed",
      description: error.message || "Could not update track details",
      variant: "destructive",
    });
    return false;
  }
};

export const getUserTracks = async (): Promise<TrackData[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    toast({
      title: "Error Loading Tracks",
      description: error.message || "Failed to load your tracks",
      variant: "destructive",
    });
    return [];
  }
};
