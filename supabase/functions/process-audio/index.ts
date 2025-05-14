
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

    // If there are no chunks or only one chunk, just copy the file
    if (!track.chunk_count || track.chunk_count <= 1) {
      console.log(`Track ${trackId} has only one chunk, copying directly`);
      const mp3Url = await copyOriginalAudioToMP3(supabase, track);
      if (mp3Url) {
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
      return;
    }
    
    // Process multiple chunks
    console.log(`Track ${trackId} has ${track.chunk_count} chunks that will be reassembled`);
    
    // Get the base path from the original URL to locate chunks
    const baseUrl = track.compressed_url;
    
    // We'll create a simple copy of the first chunk as our mp3 for now
    // In a real implementation, we would download all chunks and combine them
    
    // Extract the chunk path from the URL
    let chunkPath = '';
    try {
      // Extract just the path portion of the URL (after the bucket name)
      const url = new URL(baseUrl);
      const pathParts = url.pathname.split('/');
      let relevantPath = '';
      
      // Find the portion after 'audio' in the path
      const audioIndex = pathParts.findIndex(part => part === 'audio');
      if (audioIndex >= 0 && audioIndex < pathParts.length - 1) {
        relevantPath = pathParts.slice(audioIndex + 1).join('/');
      }
      
      if (relevantPath) {
        chunkPath = relevantPath;
      } else {
        // Fallback if we can't parse the URL properly
        chunkPath = baseUrl.split('/public/audio/')[1];
      }
      
      console.log(`Identified chunk path: ${chunkPath}`);
    } catch (error) {
      console.error("Error parsing URL:", error);
      await updateTrackStatusToFailed(supabase, trackId);
      return;
    }
    
    if (!chunkPath) {
      console.error("Could not determine chunk path");
      await updateTrackStatusToFailed(supabase, trackId);
      return;
    }
    
    try {
      // Download the first chunk
      const { data: audioData, error: downloadError } = await supabase
        .storage
        .from('audio')
        .download(chunkPath);
        
      if (downloadError || !audioData) {
        console.error("Error downloading audio chunk:", downloadError);
        await updateTrackStatusToFailed(supabase, trackId);
        return;
      }
      
      // For now, we'll just reupload this same data as the "MP3"
      // In a real implementation, you would transcode the audio here
      
      // Generate a unique filename for the processed MP3
      const mp3Filename = `processed_${trackId}.mp3`;
      const mp3Path = `${track.user_id}/${mp3Filename}`;
      
      // Upload the processed file to the processed_audio bucket with the correct MIME type
      const { error: uploadError } = await supabase
        .storage
        .from("processed_audio")
        .upload(mp3Path, audioData, {
          contentType: "audio/mpeg", // Changed from "audio/mp3" to "audio/mpeg" which is the standard MIME type for MP3 files
          cacheControl: "3600",
          upsert: true
        });
        
      if (uploadError) {
        console.error("Error uploading processed MP3:", uploadError);
        await updateTrackStatusToFailed(supabase, trackId);
        return;
      }
      
      // Get the URL for the uploaded MP3
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
      console.error(`Error processing chunks for track ${trackId}:`, error);
      await updateTrackStatusToFailed(supabase, trackId);
    }
  } catch (error) {
    console.error(`Error processing audio for track ${trackId}:`, error);
    await updateTrackStatusToFailed(supabase, trackId);
  }
}

async function copyOriginalAudioToMP3(supabase: any, track: any): Promise<string | null> {
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
    
    // Download the original file
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('audio')
      .download(filePath);
      
    if (downloadError || !fileData) {
      console.error("Error downloading original file:", downloadError);
      return null;
    }
    
    // Generate a new filename for the MP3
    const mp3Filename = `processed_${track.id}.mp3`;
    const mp3Path = `${track.user_id}/${mp3Filename}`;
    
    // Upload the file to the processed_audio bucket with the correct MIME type
    const { error: uploadError } = await supabase
      .storage
      .from("processed_audio")
      .upload(mp3Path, fileData, {
        contentType: "audio/mpeg", // Changed from "audio/mp3" to "audio/mpeg" which is the standard MIME type for MP3 files
        cacheControl: "3600",
        upsert: true
      });
      
    if (uploadError) {
      console.error("Error uploading MP3:", uploadError);
      return null;
    }
    
    // Get the URL for the uploaded MP3
    const { data: urlData } = await supabase.storage
      .from("processed_audio")
      .getPublicUrl(mp3Path);
      
    return urlData.publicUrl;
    
  } catch (error) {
    console.error("Error in copyOriginalAudioToMP3:", error);
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
