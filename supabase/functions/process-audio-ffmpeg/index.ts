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
    console.log(`FFMPEG_SERVICE_URL is configured with length: ${FFMPEG_SERVICE_URL.length}`);
    console.log(`AWS_LAMBDA_API_KEY is configured with length: ${AWS_LAMBDA_API_KEY.length}`);

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
    
    // IMPROVED URL PARSING: More robust extraction of bucket name and file path from Supabase storage URL
    let bucketName = '';
    let filePath = '';
    let success = false;
    
    console.log(`Parsing storage URL: ${originalUrl}`);

    try {
      // Regular expression to match Supabase storage URLs and extract bucket and path
      // This pattern looks for the 'public/{bucket}/{path}' pattern in the URL
      const storageUrlPattern = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;
      const match = originalUrl.match(storageUrlPattern);
      
      if (match && match.length === 3) {
        bucketName = match[1]; // First capture group is the bucket name
        filePath = match[2];   // Second capture group is the file path
        success = true;
        console.log(`Successfully extracted using regex pattern - bucket: ${bucketName}, path: ${filePath}`);
      } 
      // If regex pattern didn't match, try URL parsing as fallback
      else {
        const url = new URL(originalUrl);
        const pathSegments = url.pathname.split('/');
        
        // Look for the 'public' segment which indicates the start of the bucket/path pattern
        const publicIndex = pathSegments.findIndex(segment => segment === 'public');
        
        if (publicIndex >= 0 && publicIndex < pathSegments.length - 2) {
          bucketName = pathSegments[publicIndex + 1];
          filePath = pathSegments.slice(publicIndex + 2).join('/');
          success = true;
          console.log(`Successfully extracted using URL parsing - bucket: ${bucketName}, path: ${filePath}`);
        }
      }
      
      if (!success) {
        console.error(`Failed to extract bucket and path from URL: ${originalUrl}`);
        await updateTrackStatusToFailed(supabase, trackId, format);
        return;
      }
    } catch (error) {
      console.error(`Error parsing URL ${originalUrl}:`, error);
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    console.log(`Creating signed URL for bucket: ${bucketName}, file path: ${filePath}`);
    
    // Create signed URL for FFmpeg service to download the original file
    const { data: { signedURL }, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 10); // 10 minute expiry
    
    if (!signedURL || signedUrlError) {
      console.error("Failed to create signed URL for original audio:", signedUrlError);
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    console.log(`Successfully created signed URL with length: ${signedURL.length}`);
    
    // Call the FFmpeg service to process the audio with improved error handling and logging
    const processResults = await callFFmpegService(signedURL, trackId, format);
    
    if (!processResults.success) {
      console.error("Failed to process audio:", processResults.error);
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    // Update track with new URLs and status
    const finalUpdateData: any = {};
    
    if ((format === 'all' || format === 'mp3') && processResults.mp3Url) {
      finalUpdateData.mp3_url = processResults.mp3Url;
      finalUpdateData.processing_status = 'completed';
      console.log(`MP3 processing completed for track: ${trackId}`);
    }
    
    if ((format === 'all' || format === 'opus') && processResults.opusUrl) {
      finalUpdateData.opus_url = processResults.opusUrl;
      finalUpdateData.opus_processing_status = 'completed';
      console.log(`Opus processing completed for track: ${trackId}`);
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

async function callFFmpegService(signedUrl: string, trackId: string, format: string): Promise<{
  success: boolean;
  mp3Url?: string;
  opusUrl?: string;
  error?: string;
}> {
  try {
    console.log(`Calling FFmpeg service at ${FFMPEG_SERVICE_URL} for track ${trackId}`);
    
    // First attempt: Call the FFmpeg service with the signed URL and include the API key in headers
    let retries = 2;
    let response;
    let lastError;
    
    while (retries >= 0) {
      try {
        console.log(`FFmpeg API call attempt ${2-retries} for track ${trackId}`);
        
        response = await fetch(FFMPEG_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': AWS_LAMBDA_API_KEY
          },
          body: JSON.stringify({
            trackId,
            format,
            signedUrl // Changed back to signedUrl to match Lambda expectation
          })
        });
        
        // If the request was successful, break out of the retry loop
        if (response.ok) {
          break;
        }
        
        // If we got a non-OK response, log it and retry
        const errorText = await response.text();
        console.error(`FFmpeg service responded with status ${response.status}: ${errorText}`);
        lastError = `Status ${response.status}: ${errorText}`;
        
        // Decrease retry count
        retries--;
        
        // If we have retries left, wait before trying again
        if (retries >= 0) {
          console.log(`Retrying FFmpeg API call in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Network error calling FFmpeg service: ${error.message}`);
        lastError = error.message;
        
        // Decrease retry count
        retries--;
        
        // If we have retries left, wait before trying again
        if (retries >= 0) {
          console.log(`Retrying FFmpeg API call in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // If we exhausted retries and still have no successful response
    if (!response || !response.ok) {
      console.error(`All FFmpeg service call attempts failed for track ${trackId}`);
      return {
        success: false,
        error: lastError || `FFmpeg service call failed after multiple attempts`
      };
    }
    
    console.log(`FFmpeg service responded successfully for track ${trackId}`);
    const responseData = await response.json();
    console.log(`FFmpeg service response data:`, responseData);
    
    // Check if the response has the expected structure
    if (responseData && typeof responseData === 'object') {
      const result = {
        success: true,
        mp3Url: responseData.mp3Url,
        opusUrl: responseData.opusUrl
      };
      
      // Log the result for debugging
      console.log(`FFmpeg processing result:`, result);
      return result;
    } else {
      console.error(`FFmpeg service returned unexpected response format:`, responseData);
      return {
        success: false,
        error: `Unexpected response format from FFmpeg service`
      };
    }
  } catch (error) {
    console.error(`Error in callFFmpegService:`, error);
    return {
      success: false,
      error: `Error calling FFmpeg service: ${error.message}`
    };
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
