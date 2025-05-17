
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface RequestBody {
  trackId: string;
  format?: string; // Optional parameter to specify format: 'mp3', 'opus', or 'all'
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
    const { trackId, format = 'all' } = await req.json() as RequestBody;
    
    if (!trackId) {
      return new Response(JSON.stringify({ error: "Track ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Update track statuses based on the requested format
    const updateData: any = {};
    
    if (format === 'all' || format === 'mp3') {
      updateData.processing_status = 'queued';
    }
    
    if (format === 'all' || format === 'opus') {
      updateData.opus_processing_status = 'queued';
    }
    
    const { error: updateError } = await supabase
      .from("tracks")
      .update(updateData)
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
    EdgeRuntime.waitUntil(processAudio(supabase, trackId, format));

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Audio processing started for format(s): ${format}` 
    }), {
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

async function processAudio(supabase: any, trackId: string, format: string = 'all') {
  try {
    console.log(`Starting audio processing for track: ${trackId}, formats: ${format}`);
    
    // Update status to processing based on requested format
    const updateData: any = {};
    
    if (format === 'all' || format === 'mp3') {
      updateData.processing_status = 'processing';
    }
    
    if (format === 'all' || format === 'opus') {
      updateData.opus_processing_status = 'processing';
    }
    
    await supabase
      .from("tracks")
      .update(updateData)
      .eq("id", trackId);
    
    // Get track details to find the audio file
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("*")
      .eq("id", trackId)
      .single();
    
    if (trackError || !track) {
      console.error("Error fetching track:", trackError);
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }

    // Extract the file path from the original URL
    const audioUrl = track.original_url || track.compressed_url;
    let filePath = '';
    
    try {
      // Parse the URL to extract the path after /audio/
      const url = new URL(audioUrl);
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
        filePath = audioUrl.split('/public/audio/')[1];
      }
      
      console.log(`Extracted file path: ${filePath} from URL: ${audioUrl}`);
    } catch (error) {
      console.error("Error parsing URL:", error);
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    if (!filePath) {
      console.error("Could not determine file path");
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    // Download the audio file from Supabase
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('audio')
      .download(filePath);
      
    if (downloadError || !fileData) {
      console.error("Error downloading audio file:", downloadError);
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    console.log(`Successfully downloaded audio file for track ${trackId}, size: ${fileData.size} bytes`);

    // Process with Cloudinary - with retries for each format
    let mp3Url = null;
    let opusUrl = null;
    
    // Process MP3 if requested
    if (format === 'all' || format === 'mp3') {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          mp3Url = await uploadToCloudinary(fileData, track, 'mp3');
          if (mp3Url) break;
          
          console.log(`MP3 attempt ${attempt} failed, retrying...`);
        } catch (error) {
          console.error(`MP3 upload attempt ${attempt} failed:`, error);
          if (attempt === MAX_RETRIES) {
            console.error("All MP3 retry attempts failed");
            await updateTrackStatusToFailed(supabase, trackId, 'mp3');
          }
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }
    
    // Process Opus if requested
    if (format === 'all' || format === 'opus') {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          opusUrl = await uploadToCloudinary(fileData, track, 'opus');
          if (opusUrl) break;
          
          console.log(`Opus attempt ${attempt} failed, retrying...`);
        } catch (error) {
          console.error(`Opus upload attempt ${attempt} failed:`, error);
          if (attempt === MAX_RETRIES) {
            console.error("All Opus retry attempts failed");
            await updateTrackStatusToFailed(supabase, trackId, 'opus');
          }
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }
    
    // Update track with successful processing results
    const finalUpdateData: any = {};
    
    if (format === 'all' || format === 'mp3') {
      if (mp3Url) {
        finalUpdateData.mp3_url = mp3Url;
        finalUpdateData.processing_status = 'completed';
        console.log(`MP3 processing completed for track: ${trackId}`);
      } else if (format === 'mp3') {
        // Only set to failed if specifically requesting MP3 and it failed
        finalUpdateData.processing_status = 'failed';
      }
    }
    
    if (format === 'all' || format === 'opus') {
      if (opusUrl) {
        finalUpdateData.opus_url = opusUrl;
        finalUpdateData.opus_processing_status = 'completed';
        console.log(`Opus processing completed for track: ${trackId}`);
      } else if (format === 'opus') {
        // Only set to failed if specifically requesting Opus and it failed
        finalUpdateData.opus_processing_status = 'failed';
      }
    }
    
    if (Object.keys(finalUpdateData).length > 0) {
      await supabase
        .from("tracks")
        .update(finalUpdateData)
        .eq("id", trackId);
    }
    
    console.log(`Processing completed for track: ${trackId}, formats: ${format}`);
  } catch (error) {
    console.error(`Error processing audio for track ${trackId}:`, error);
    await updateTrackStatusToFailed(supabase, trackId, format);
  }
}

async function uploadToCloudinary(fileData: Blob, track: any, format: string = 'mp3'): Promise<string | null> {
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
    
    // Set different public IDs for different formats
    const publicId = format === 'opus' 
      ? `audio-opus-${track.id}` 
      : `audio-${track.id}`;
    
    formData.append('public_id', publicId);
    
    // Set transformation params based on format
    if (format === 'opus') {
      // For Opus format - use audio codec opus with bitrate 96k
      formData.append('transformation', 'audio_codec:opus,audio_bitrate:96k');
    } else {
      // For MP3 format - use audio codec mp3 with quality 70%
      formData.append('transformation', 'audio_codec:mp3,audio_quality:70');
    }
    
    // Upload to Cloudinary using the upload preset
    console.log(`Uploading to Cloudinary using preset ${CLOUDINARY_UPLOAD_PRESET} for format ${format}...`);
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
      console.log(`Successfully uploaded ${format} to Cloudinary: ${data.secure_url}`);
      
      // Ensure we have the correct file extension
      const expectedExt = format === 'opus' ? 'opus' : 'mp3';
      const url = data.format === expectedExt
        ? data.secure_url
        : `${data.secure_url.split('.').slice(0, -1).join('.')}.${expectedExt}`;
        
      return url;
    } else {
      console.error("Cloudinary response missing secure_url:", data);
      return null;
    }
    
  } catch (error) {
    console.error(`Error uploading ${format} to Cloudinary:`, error);
    return null;
  }
}

async function updateTrackStatusToFailed(supabase: any, trackId: string, format: string = 'all') {
  try {
    const updateData: any = {};
    
    if (format === 'all' || format === 'mp3') {
      updateData.processing_status = 'failed';
    }
    
    if (format === 'all' || format === 'opus') {
      updateData.opus_processing_status = 'failed';
    }
    
    await supabase
      .from("tracks")
      .update(updateData)
      .eq("id", trackId);
  } catch (error) {
    console.error(`Error updating track ${trackId} status to failed:`, error);
  }
}
