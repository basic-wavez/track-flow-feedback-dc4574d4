
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { ProcessingFormat } from "../utils/status-utils.ts";

interface RequestBody {
  trackId: string;
  format?: ProcessingFormat; // Optional parameter to specify format: 'mp3', 'opus', or 'all'
}

const SUPABASE_URL = "https://qzykfyavenplpxpdnfxh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
    const { trackId, format = 'all' } = await req.json() as RequestBody;
    
    if (!trackId) {
      return new Response(JSON.stringify({ error: "Track ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Update track statuses based on the requested format
    const updateData: Record<string, string> = {};
    
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
    await ensureProcessedAudioBucketExists(supabase);

    // Get track details to find the audio file
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("*")
      .eq("id", trackId)
      .single();
    
    if (trackError || !track) {
      console.error("Error fetching track:", trackError);
      return new Response(JSON.stringify({ error: "Failed to fetch track data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the original URL for the audio file
    const originalUrl = getOriginalAudioUrl(track);
    if (!originalUrl) {
      return new Response(JSON.stringify({ error: "No audio URL found for this track" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure the URL is properly formatted with full URL
    const fullUrl = ensureFullUrl(originalUrl, SUPABASE_URL);

    // Start processing in the background to avoid timeout - now using the FFmpeg function
    // @ts-ignore: EdgeRuntime exists in Supabase Edge Functions
    EdgeRuntime.waitUntil(callProcessAudioFFmpeg(supabase, trackId, format, fullUrl));

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

/**
 * Ensures the processed_audio bucket exists
 */
async function ensureProcessedAudioBucketExists(supabase: any): Promise<void> {
  try {
    const { data: bucketData, error: bucketCheckError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketCheckError) {
      console.error("Error checking buckets:", bucketCheckError);
      return;
    }
    
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
  } catch (error) {
    console.error("Error ensuring processed_audio bucket exists:", error);
  }
}

/**
 * Gets the original audio URL from the track record
 */
function getOriginalAudioUrl(track: any): string | null {
  return track.original_url || track.compressed_url || null;
}

/**
 * Ensures the URL is a full URL
 */
function ensureFullUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  // If it's just a path, construct the full URL
  return `${baseUrl}/storage/v1/object/public/${url}`;
}

/**
 * Calls the process-audio-ffmpeg function to process the audio
 */
async function callProcessAudioFFmpeg(supabase: any, trackId: string, format: ProcessingFormat, originalUrl: string): Promise<void> {
  try {
    console.log(`Starting FFmpeg audio processing for track: ${trackId}, format: ${format}`);

    // Call our new FFmpeg edge function
    const ffmpegFunctionUrl = `${SUPABASE_URL}/functions/v1/process-audio-ffmpeg`;
    const response = await fetch(ffmpegFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        trackId,
        format,
        originalUrl
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error calling FFmpeg function: ${response.status} - ${errorText}`);
      
      // Update track status to failed
      const updateData: Record<string, string> = {};
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
        
      throw new Error(`FFmpeg function error: ${errorText}`);
    } else {
      const result = await response.json();
      console.log(`FFmpeg processing initiated: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error(`Error in callProcessAudioFFmpeg: ${error.message}`);
    
    // Update track status to failed
    const updateData: Record<string, string> = {};
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
  }
}
