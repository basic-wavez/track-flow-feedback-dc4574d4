
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
    
    // Get track details to find the audio file
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
      await updateTrackStatusToFailed(supabase, trackId);
      return;
    }
    
    if (!filePath) {
      console.error("Could not determine file path");
      await updateTrackStatusToFailed(supabase, trackId);
      return;
    }
    
    // Download the audio file from Supabase
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('audio')
      .download(filePath);
      
    if (downloadError || !fileData) {
      console.error("Error downloading audio file:", downloadError);
      await updateTrackStatusToFailed(supabase, trackId);
      return;
    }
    
    console.log(`Successfully downloaded audio file for track ${trackId}, size: ${fileData.size} bytes`);

    // Process with Cloudinary - with retries
    let mp3Url = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        mp3Url = await uploadToCloudinary(fileData, track);
        if (mp3Url) break;
        
        console.log(`Attempt ${attempt} failed, retrying...`);
      } catch (error) {
        console.error(`Upload attempt ${attempt} failed:`, error);
        if (attempt === MAX_RETRIES) {
          console.error("All retry attempts failed");
          await updateTrackStatusToFailed(supabase, trackId);
          return;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
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
