
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

    if (!FFMPEG_SERVICE_URL) {
      return new Response(JSON.stringify({ error: "FFMPEG_SERVICE_URL is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    
    // Create signed URL for FFmpeg service to download the original file
    const { data: { signedURL } } = await supabase.storage.from('audio').createSignedUrl(
      originalUrl.split('/audio/')[1], 
      60 * 10 // 10 minute expiry
    );
    
    if (!signedURL) {
      console.error("Failed to create signed URL for original audio");
      await updateTrackStatusToFailed(supabase, trackId, format);
      return;
    }
    
    // Call the FFmpeg service to process the audio
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
    // Call the FFmpeg service with the signed URL
    const response = await fetch(FFMPEG_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trackId,
        format,
        signedUrl
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `FFmpeg service responded with status ${response.status}: ${errorText}`
      };
    }
    
    return await response.json();
  } catch (error) {
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
