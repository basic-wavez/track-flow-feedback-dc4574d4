
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, accept',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
};

// Version for debugging
const VERSION = "1.2";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the URL to proxy from the request URL
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Audio Proxy v${VERSION} - Proxying request to: ${targetUrl}`);
    
    // Create headers to forward
    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      // Skip host header and a few others to avoid conflicts
      if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    // Make the request to the target URL
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      // No need to forward body for GET requests
    });

    // If response is not ok, return error
    if (!response.ok) {
      console.error(`Error from target: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify({ 
        error: `Target returned ${response.status}`,
        targetStatus: response.status,
        targetStatusText: response.statusText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the response headers to preserve
    const responseHeaders = new Headers();
    
    // Add all response headers
    for (const [key, value] of response.headers.entries()) {
      responseHeaders.set(key, value);
    }
    
    // Add CORS headers
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value);
    }

    // Important: Log content type for debugging
    console.log(`Target Content-Type: ${response.headers.get('content-type')}`);
    
    // Create and return a new response with original body and combined headers
    // Note: We're using the response body directly, preserving the binary data
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("Error in audio-proxy:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
