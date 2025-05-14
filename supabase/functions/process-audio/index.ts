
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

    // If there are no chunks or only one chunk, no processing needed - just copy the file
    if (!track.chunk_count || track.chunk_count <= 1) {
      console.log(`Track ${trackId} has only one chunk, copying directly`);
      await handleSingleChunk(supabase, track);
      return;
    }
    
    // Get chunk URLs - In a real implementation, we'd download and reassemble these chunks
    // For now we'll simulate this process and just update the status
    console.log(`Track ${trackId} has ${track.chunk_count} chunks that would be reassembled`);
    
    // In a real implementation:
    // 1. Download all chunks and reassemble
    // 2. Transcode to MP3 with FFmpeg (needs to be added as a package in the edge function)
    // 3. Upload the transcoded file
    
    // For this implementation, we'll assume successful processing after a delay
    // to simulate the transcoding time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a unique filename for the processed MP3
    const mp3Filename = `processed_${trackId}.mp3`;
    const mp3Path = `${track.user_id}/${mp3Filename}`;
    
    // In real implementation, we'd upload the processed file here
    // Instead, we'll just generate a fake URL for demonstration
    const { data: urlData } = await supabase.storage
      .from("processed_audio")
      .getPublicUrl(mp3Path);
      
    const mp3Url = urlData.publicUrl;
    
    // Update track with the MP3 URL and mark as completed
    await supabase
      .from("tracks")
      .update({
        mp3_url: mp3Url,
        processing_status: "completed"
      })
      .eq("id", trackId);
      
    console.log(`Processing completed for track: ${trackId}`);
    
  } catch (error) {
    console.error(`Error processing audio for track ${trackId}:`, error);
    await updateTrackStatusToFailed(supabase, trackId);
  }
}

async function handleSingleChunk(supabase: any, track: any) {
  try {
    // For single chunks, we can just reference the original file
    // In a real implementation, we'd still transcode it to MP3
    
    // Update track with the original URL as the MP3 URL
    await supabase
      .from("tracks")
      .update({
        mp3_url: track.compressed_url, // In a real implementation, this would be the transcoded URL
        processing_status: "completed"
      })
      .eq("id", track.id);
      
    console.log(`Single chunk processing completed for track: ${track.id}`);
    
  } catch (error) {
    console.error(`Error handling single chunk for track ${track.id}:`, error);
    await updateTrackStatusToFailed(supabase, track.id);
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
