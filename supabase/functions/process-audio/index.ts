
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface RequestBody {
  trackId: string;
}

const SUPABASE_URL = "https://qzykfyavenplpxpdnfxh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME") || "";
const CLOUDINARY_UPLOAD_PRESET = Deno.env.get("CLOUDINARY_UPLOAD_PRESET") || "wip-man";
const MAX_RETRIES = 3;

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Validate Cloudinary configuration
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Cloudinary configuration missing");
    }
    
    // Create a Supabase client with the service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { trackId } = await req.json() as RequestBody;
    
    if (!trackId) {
      return new Response(JSON.stringify({ error: "Track ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Update track status to "queued"
    const { error: updateError } = await supabase
      .from("tracks")
      .update({ processing_status: "queued" })
      .eq("id", trackId);
    
    if (updateError) {
      console.error("Error updating track status:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update track status" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure the processed_audio bucket exists
    const { data: bucketData, error: bucketCheckError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketCheckError) {
      console.error("Error checking buckets:", bucketCheckError);
    } else {
      const bucketExists = bucketData.some(bucket => bucket.name === "processed_audio");
      
      if (!bucketExists) {
        // Create the processed_audio bucket if it doesn't exist
        const { error: createBucketError } = await supabase
          .storage
          .createBucket("processed_audio", {
            public: true
          });
          
        if (createBucketError) {
          console.error("Error creating bucket:", createBucketError);
        } else {
          console.log("Created processed_audio bucket");
        }
      }
    }

    // Start processing in the background to avoid timeout
    // @ts-ignore: EdgeRuntime exists in Supabase Edge Functions
    EdgeRuntime.waitUntil(processAudio(supabase, trackId));

    return new Response(JSON.stringify({ success: true, message: "Audio processing started" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processAudio(supabase: any, trackId: string) {
  try {
    console.log(`Starting audio processing for track: ${trackId}`);
    
    // Update status to processing
    await supabase
      .from("tracks")
      .update({ processing_status: "processing" })
      .eq("id", trackId);
    
    // Get track details to find chunks
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("*")
      .eq("id", trackId)
      .single();
    
    if (trackError || !track) {
      console.error("Error fetching track:", trackError);
      await updateTrackStatusToFailed(supabase, trackId);
      return;
    }

    let mp3Url = '';

    // If there are no chunks or only one chunk, process a single file
    if (!track.chunk_count || track.chunk_count <= 1) {
      console.log(`Track ${trackId} has only one chunk, processing via Cloudinary`);
      mp3Url = await processSingleFile(supabase, track);
    } else {
      // Process multiple chunks
      console.log(`Track ${trackId} has ${track.chunk_count} chunks that will be merged`);
      mp3Url = await processMultipleChunks(supabase, track);
    }
    
    if (mp3Url) {
      // Update track with successful processing
      await supabase
        .from("tracks")
        .update({
          mp3_url: mp3Url,
          processing_status: "completed"
        })
        .eq("id", trackId);
      
      console.log(`Processing completed for track: ${trackId}`);
    } else {
      await updateTrackStatusToFailed(supabase, trackId);
    }
  } catch (error) {
    console.error(`Error processing audio for track ${trackId}:`, error);
    await updateTrackStatusToFailed(supabase, trackId);
  }
}

async function processSingleFile(supabase: any, track: any): Promise<string | null> {
  try {
    // Extract the file path from the original URL
    const compressedUrl = track.compressed_url;
    let filePath = '';
    
    try {
      // Parse the URL to extract the path after /audio/
      const url = new URL(compressedUrl);
      const pathParts = url.pathname.split('/');
      let relevantPath = '';
      
      // Find the portion after 'audio' in the path
      const audioIndex = pathParts.findIndex(part => part === 'audio');
      if (audioIndex >= 0 && audioIndex < pathParts.length - 1) {
        relevantPath = pathParts.slice(audioIndex + 1).join('/');
      }
      
      if (relevantPath) {
        filePath = relevantPath;
      } else {
        // Fallback if we can't parse the URL properly
        filePath = compressedUrl.split('/public/audio/')[1];
      }
      
      console.log(`Extracted file path: ${filePath} from URL: ${compressedUrl}`);
    } catch (error) {
      console.error("Error parsing URL:", error);
      return null;
    }
    
    if (!filePath) {
      console.error("Could not determine file path");
      return null;
    }
    
    // Download the original file from Supabase
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('audio')
      .download(filePath);
      
    if (downloadError || !fileData) {
      console.error("Error downloading original file:", downloadError);
      return null;
    }

    // Upload to Cloudinary and convert to MP3 - with retries
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const mp3Url = await uploadToCloudinary(fileData, track);
        if (mp3Url) return mp3Url;
        
        console.log(`Attempt ${attempt} failed, retrying...`);
      } catch (error) {
        console.error(`Upload attempt ${attempt} failed:`, error);
        if (attempt === MAX_RETRIES) {
          console.error("All retry attempts failed");
          return null;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in processSingleFile:", error);
    return null;
  }
}

async function processMultipleChunks(supabase: any, track: any): Promise<string | null> {
  try {
    // Extract the base path from the original URL to determine the chunk path pattern
    const baseUrl = track.compressed_url;
    let basePath = '';
    
    try {
      // Extract the path portion of the URL (after the bucket name)
      const url = new URL(baseUrl);
      const pathParts = url.pathname.split('/');
      let relevantPath = '';
      
      // Find the portion after 'audio' in the path
      const audioIndex = pathParts.findIndex(part => part === 'audio');
      if (audioIndex >= 0 && audioIndex < pathParts.length - 1) {
        relevantPath = pathParts.slice(audioIndex + 1).join('/');
      }
      
      if (relevantPath) {
        basePath = relevantPath.split('_chunk_0')[0];
      } else {
        // Fallback if we can't parse the URL properly
        basePath = baseUrl.split('/public/audio/')[1].split('_chunk_0')[0];
      }
      
      console.log(`Identified base path for chunks: ${basePath}`);
    } catch (error) {
      console.error("Error parsing URL for chunks:", error);
      return null;
    }
    
    if (!basePath) {
      console.error("Could not determine base path for chunks");
      return null;
    }
    
    // Download all chunks and combine them
    const chunks: Blob[] = [];
    let totalSize = 0;
    
    console.log(`Downloading ${track.chunk_count} chunks for track ${track.id}...`);
    
    // Download all chunks
    for (let i = 0; i < track.chunk_count; i++) {
      const chunkPath = `${basePath}_chunk_${i}`;
      console.log(`Downloading chunk ${i+1}/${track.chunk_count}: ${chunkPath}`);
      
      const { data: chunkData, error: downloadError } = await supabase
        .storage
        .from('audio')
        .download(chunkPath);
      
      if (downloadError || !chunkData) {
        console.error(`Error downloading chunk ${i}:`, downloadError);
        return null;
      }
      
      chunks.push(chunkData);
      totalSize += chunkData.size;
      console.log(`Successfully downloaded chunk ${i+1}/${track.chunk_count}, size: ${chunkData.size} bytes`);
    }
    
    if (chunks.length === 0) {
      console.error("No chunks were downloaded");
      return null;
    }
    
    // Create a new Blob by concatenating all chunks
    console.log(`Concatenating ${chunks.length} chunks with total size: ${totalSize} bytes`);
    const concatenatedFile = new Blob(chunks, { type: chunks[0].type });
    
    console.log(`Combined file created with size: ${concatenatedFile.size} bytes`);
    
    // Upload combined file to Cloudinary
    console.log(`Uploading combined file (${concatenatedFile.size} bytes) to Cloudinary...`);
    
    // Upload to Cloudinary and convert to MP3 - with retries
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const mp3Url = await uploadToCloudinary(concatenatedFile, track);
        if (mp3Url) {
          console.log(`Successfully processed all ${chunks.length} chunks for track ${track.id}`);
          return mp3Url;
        }
        
        console.log(`Attempt ${attempt} failed, retrying...`);
      } catch (error) {
        console.error(`Upload attempt ${attempt} failed:`, error);
        if (attempt === MAX_RETRIES) {
          console.error("All retry attempts failed");
          return null;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in processMultipleChunks:", error);
    return null;
  }
}

async function uploadToCloudinary(fileData: Blob, track: any): Promise<string | null> {
  try {
    // Create a FormData object for the Cloudinary upload
    const formData = new FormData();
    
    // Add file 
    formData.append('file', fileData);
    
    // Add Cloudinary parameters
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
    
    // Set some metadata to identify the upload
    formData.append('resource_type', 'auto');  // Let Cloudinary determine resource type
    formData.append('public_id', `audio-${track.id}`); // Set public ID for the file
    
    // Upload to Cloudinary using the upload preset
    console.log(`Uploading to Cloudinary using preset ${CLOUDINARY_UPLOAD_PRESET}...`);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Cloudinary upload failed with status ${response.status}:`, errorText);
      return null;
    }
    
    // Parse response
    const data = await response.json();
    
    // Get the URL from the response
    if (data.secure_url) {
      console.log(`Successfully uploaded to Cloudinary: ${data.secure_url}`);
      
      // If we need to ensure it's an MP3 URL (if format wasn't handled in the upload)
      const mp3Url = data.format === 'mp3'
        ? data.secure_url
        : `${data.secure_url.split('.').slice(0, -1).join('.')}.mp3`;
        
      return mp3Url;
    } else {
      console.error("Cloudinary response missing secure_url:", data);
      return null;
    }
    
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
}

async function updateTrackStatusToFailed(supabase: any, trackId: string) {
  try {
    await supabase
      .from("tracks")
      .update({ processing_status: "failed" })
      .eq("id", trackId);
  } catch (error) {
    console.error(`Error updating track ${trackId} status to failed:`, error);
  }
}
