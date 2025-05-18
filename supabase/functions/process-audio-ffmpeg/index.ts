
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { parseStorageUrl } from "../utils/storage-utils.ts";
import { 
  updateTrackStatusToProcessing, 
  updateTrackStatusToFailed,
  updateTrackWithProcessedUrls,
  ProcessingFormat
} from "../utils/status-utils.ts";
import {
  callLambdaService,
  LambdaProcessingRequest,
  LambdaProcessingResponse
} from "../utils/lambda-utils.ts";

interface RequestBody {
  trackId: string;
  format: ProcessingFormat;
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
    const requestBody = await req.json() as RequestBody;
    const { trackId, format, originalUrl } = requestBody;
    
    if (!trackId || !format || !originalUrl) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate environment variables
    if (!FFMPEG_SERVICE_URL || !AWS_LAMBDA_API_KEY) {
      const missingVars = [];
      if (!FFMPEG_SERVICE_URL) missingVars.push("FFMPEG_SERVICE_URL");
      if (!AWS_LAMBDA_API_KEY) missingVars.push("AWS_LAMBDA_API_KEY");
      
      const errorMsg = `Missing required environment variables: ${missingVars.join(", ")}`;
      console.error(errorMsg);
      
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Received request to process track ${trackId} in format ${format}`);
    
    // Process the audio file using FFmpeg service
    // @ts-ignore: EdgeRuntime exists in Supabase Edge Functions
    EdgeRuntime.waitUntil(processAudioFile(supabase, trackId, format, originalUrl));

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

/**
 * Main processing function that handles the audio processing workflow
 */
async function processAudioFile(supabase: any, trackId: string, format: ProcessingFormat, originalUrl: string) {
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
    await updateTrackStatusToProcessing(supabase, trackId, format);
    
    // Parse the storage URL to extract bucket and path
    let parsedUrl;
    try {
      parsedUrl = parseStorageUrl(originalUrl);
    } catch (error) {
      console.error(`Error parsing URL:`, error);
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    const { bucketName, filePath } = parsedUrl;
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
    
    // Prepare request for Lambda service
    const lambdaRequest: LambdaProcessingRequest = {
      trackId,
      format,
      signedUrl: signedURL // This is the key parameter name that Lambda expects
    };
    
    // Call the FFmpeg Lambda service
    try {
      const responseData = await callLambdaService(
        FFMPEG_SERVICE_URL,
        AWS_LAMBDA_API_KEY,
        lambdaRequest
      );
      
      // Update track with new URLs and status
      await updateTrackWithProcessedUrls(
        supabase,
        trackId,
        format,
        responseData.mp3Url,
        responseData.opusUrl
      );
      
    } catch (error) {
      console.error(`Error processing audio with Lambda:`, error);
      await updateTrackStatusToFailed(supabase, trackId, format);
    }
  } catch (error) {
    console.error(`Error processing audio for track ${trackId}:`, error);
    await updateTrackStatusToFailed(supabase, trackId, format);
  }
}
