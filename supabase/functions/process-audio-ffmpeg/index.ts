
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface RequestBody {
  trackId: string;
  format: string; // 'mp3', 'opus', or 'all'
  originalUrl: string;
}

const SUPABASE_URL = "https://qzykfyavenplpxpdnfxh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FFMPEG_SERVICE_URL = Deno.env.get("FFMPEG_SERVICE_URL") || "";
const AWS_LAMBDA_API_KEY = Deno.env.get("AWS_LAMBDA_API_KEY") || "";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
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
    const { trackId, format, originalUrl } = await req.json() as RequestBody;
    
    if (!trackId || !format || !originalUrl) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate FFMPEG_SERVICE_URL and AWS_LAMBDA_API_KEY
    if (!FFMPEG_SERVICE_URL) {
      console.error("Missing FFMPEG_SERVICE_URL environment variable");
      return new Response(JSON.stringify({ error: "FFMPEG_SERVICE_URL is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!AWS_LAMBDA_API_KEY) {
      console.error("Missing AWS_LAMBDA_API_KEY environment variable");
      return new Response(JSON.stringify({ error: "AWS_LAMBDA_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Received request to process track ${trackId} in format ${format}`);
    
    // Process the audio file using FFmpeg service
    // @ts-ignore: EdgeRuntime exists in Supabase Edge Functions
    EdgeRuntime.waitUntil(processAudioWithFFmpeg(supabase, trackId, format, originalUrl));

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Audio processing started for track ${trackId} in format ${format}` 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in process-audio-ffmpeg function:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processAudioWithFFmpeg(supabase: any, trackId: string, format: string, originalUrl: string) {
  try {
    // Get the track record to work with
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

    console.log(`Processing audio for track ${trackId} in format ${format}, original URL: ${originalUrl}`);
    
    // Update track status to processing
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
    
    // Create signed URL for the original file
    // Extract bucket and path from the original URL
    let bucketName = '';
    let filePath = '';
    
    try {
      // Parse storage URL to extract bucket and path
      const urlPattern = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;
      const match = originalUrl.match(urlPattern);
      
      if (match && match.length === 3) {
        bucketName = match[1]; // First capture group is the bucket name
        filePath = match[2];   // Second capture group is the file path
      } else {
        throw new Error("Invalid storage URL format");
      }
    } catch (error) {
      console.error(`Error parsing URL ${originalUrl}:`, error);
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    console.log(`Creating signed URL for bucket: ${bucketName}, file path: ${filePath}`);
    
    // Create signed URL for FFmpeg service
    const { data: { signedURL }, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 10); // 10 minute expiry
    
    if (!signedURL || signedUrlError) {
      console.error("Failed to create signed URL for original audio:", signedUrlError);
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    console.log(`Successfully created signed URL with length: ${signedURL.length}`);
    
    // Call the FFmpeg Lambda service with the correct parameter name (signedUrl)
    try {
      console.log(`Calling FFmpeg Lambda at ${FFMPEG_SERVICE_URL}`);
      
      const response = await fetch(FFMPEG_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AWS_LAMBDA_API_KEY
        },
        body: JSON.stringify({
          trackId,
          format,
          signedUrl: signedURL  // IMPORTANT: Using signedUrl parameter name to match Lambda expectations
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FFmpeg Lambda service responded with status ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log(`FFmpeg Lambda service response:`, responseData);
      
      // Update track with new URLs and status
      const finalUpdateData: any = {};
      
      if ((format === 'all' || format === 'mp3') && responseData.mp3Url) {
        finalUpdateData.mp3_url = responseData.mp3Url;
        finalUpdateData.processing_status = 'completed';
        console.log(`MP3 processing completed for track: ${trackId}`);
      }
      
      if ((format === 'all' || format === 'opus') && responseData.opusUrl) {
        finalUpdateData.opus_url = responseData.opusUrl;
        finalUpdateData.opus_processing_status = 'completed';
        console.log(`Opus processing completed for track: ${trackId}`);
      }
      
      if (Object.keys(finalUpdateData).length > 0) {
        await supabase
          .from("tracks")
          .update(finalUpdateData)
          .eq("id", trackId);
      }
      
    } catch (error) {
      console.error(`Error calling FFmpeg Lambda service:`, error);
      await updateTrackStatusToFailed(supabase, trackId, format);
    }
  } catch (error) {
    console.error(`Error processing audio for track ${trackId}:`, error);
    await updateTrackStatusToFailed(supabase, trackId, format);
  }
}

async function updateTrackStatusToFailed(supabase: any, trackId: string, format: string) {
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
      
    console.log(`Updated track ${trackId} status to failed for format: ${format}`);
  } catch (error) {
    console.error(`Error updating track ${trackId} status to failed:`, error);
  }
}
