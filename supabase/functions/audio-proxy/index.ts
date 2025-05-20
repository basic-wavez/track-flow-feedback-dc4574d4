
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, accept',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
};

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

    console.log(`Proxying request to: ${targetUrl}`);
    
    // Forward the original request headers
    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      // Skip host header to avoid conflicts
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    }

    // Make the request to the target URL
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      // For GET requests, no need to forward body
    });

    // Get the response data
    const body = response.body;
    
    // Create and return a new response with CORS headers
    const proxyResponse = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders
      }
    });
    
    return proxyResponse;
  } catch (error) {
    console.error("Error in audio-proxy:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
