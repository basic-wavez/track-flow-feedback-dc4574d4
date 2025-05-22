
// Import needed modules
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { callLambdaService } from '../utils/lambda-utils.ts';
import { 
  updateTrackStatusToProcessing, 
  updateTrackStatusToFailed,
  updateTrackWithProcessedUrls
} from '../utils/status-utils.ts';

// Define the request handler
Deno.serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, X-Client-Info',
        },
      });
    }
    
    // Set up Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ffmpegServiceUrl = Deno.env.get('FFMPEG_SERVICE_URL');
    const awsLambdaApiKey = Deno.env.get('AWS_LAMBDA_API_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or service role key');
    }
    
    if (!ffmpegServiceUrl || !awsLambdaApiKey) {
      throw new Error('Missing FFmpeg service URL or API key');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const { trackId, format = 'all', originalUrl, signedUrl } = await req.json();
    
    if (!trackId) {
      throw new Error('Missing track ID');
    }
    
    console.log(`Processing ${format} for track ${trackId}`);
    
    // Update track status to processing
    await updateTrackStatusToProcessing(supabase, trackId, format);
    
    // Get track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();
    
    if (trackError || !track) {
      throw new Error(`Error fetching track ${trackId}: ${trackError?.message}`);
    }
    
    // Generate a presigned URL for the original file if not provided
    let audioSourceUrl = signedUrl;
    
    if (!audioSourceUrl) {
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('audio')
        .createSignedUrl(track.original_url?.split('/public/audio/')[1] || '', 3600);
      
      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error(`Error generating signed URL: ${signedUrlError?.message}`);
      }
      
      audioSourceUrl = signedUrlData.signedUrl;
      console.log(`Generated signed URL for track ${trackId}`);
    }
    
    // Call FFmpeg Lambda service
    try {
      console.log(`Calling FFmpeg Lambda at ${ffmpegServiceUrl} for track ${trackId}`);
      
      const lambdaResponse = await callLambdaService(ffmpegServiceUrl, awsLambdaApiKey, {
        trackId,
        format,
        signedUrl: audioSourceUrl,
        generateWaveform: true // Explicitly request waveform generation
      });
      
      console.log(`FFmpeg Lambda service response:`, lambdaResponse);
      
      if (!lambdaResponse.success) {
        throw new Error(`FFmpeg service failed: ${lambdaResponse.error}`);
      }
      
      // Check if we have MP3 URL
      if (format === 'all' || format === 'mp3') {
        if (!lambdaResponse.mp3Url) {
          console.log(`No MP3 URL returned from Lambda service`);
        } else {
          console.log(`MP3 processing completed for track: ${trackId}`);
        }
      }
      
      // Check if we have Opus URL
      if (format === 'all' || format === 'opus') {
        if (!lambdaResponse.opusUrl) {
          console.log(`No Opus URL returned from Lambda service`);
        } else {
          console.log(`Opus processing completed for track: ${trackId}`);
        }
      }
      
      // Check if we have waveform peaks URL
      if (!lambdaResponse.waveformPeaksUrl) {
        console.log(`No waveform peaks URL returned from Lambda service`);
      } else {
        console.log(`Lambda returned waveform peaks URL: ${lambdaResponse.waveformPeaksUrl}`);
      }
      
      // Update track with processed URLs
      await updateTrackWithProcessedUrls(
        supabase,
        trackId,
        format,
        lambdaResponse.mp3Url,
        lambdaResponse.opusUrl,
        lambdaResponse.waveformPeaksUrl
      );
      
      console.log(`Successfully processed ${format} for track ${trackId}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Track ${trackId} processed successfully`,
          mp3Url: lambdaResponse.mp3Url,
          opusUrl: lambdaResponse.opusUrl,
          waveformPeaksUrl: lambdaResponse.waveformPeaksUrl
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    } catch (lambdaError) {
      console.error(`Lambda service error: ${lambdaError.message}`);
      
      // Update track status to failed
      await updateTrackStatusToFailed(supabase, trackId, format);
      
      throw lambdaError;
    }
  } catch (error) {
    console.error(`Error in process-audio-ffmpeg function: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
});
