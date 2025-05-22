
/**
 * Utility functions for AWS Lambda communication
 */

export interface LambdaProcessingRequest {
  trackId: string;
  format: 'mp3' | 'opus' | 'all';
  signedUrl: string;
}

export interface LambdaProcessingResponse {
  success: boolean;
  mp3Url?: string;
  opusUrl?: string;
  waveformPeaksUrl?: string;
  error?: string;
}

/**
 * Call the FFmpeg Lambda service to process audio
 * @param lambdaUrl The URL of the Lambda service
 * @param apiKey API key for Lambda authorization
 * @param requestData Data to send to the Lambda
 * @returns The response from the Lambda
 */
export async function callLambdaService(
  lambdaUrl: string,
  apiKey: string,
  requestData: LambdaProcessingRequest
): Promise<LambdaProcessingResponse> {
  console.log(`Calling FFmpeg Lambda at ${lambdaUrl} for track ${requestData.trackId}`);
  
  if (!lambdaUrl || !apiKey) {
    throw new Error("Missing Lambda configuration (URL or API key)");
  }
  
  try {
    const response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FFmpeg Lambda service responded with status ${response.status}: ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log(`FFmpeg Lambda service response:`, responseData);
    
    // If the Lambda response has an Opus URL, log it
    if (responseData.opusUrl) {
      console.log(`Lambda returned Opus URL: ${responseData.opusUrl}`);
    } else {
      console.log(`No Opus URL returned from Lambda service`);
      
      // If we requested 'all' or 'opus' but didn't get an Opus URL, try to construct one
      // based on the observed S3 bucket pattern if MP3 URL is available
      if ((requestData.format === 'all' || requestData.format === 'opus') && responseData.mp3Url) {
        console.log(`Attempting to construct Opus URL from MP3 URL pattern`);
        
        // Parse MP3 URL to extract bucket and base path
        const mp3Url = responseData.mp3Url;
        
        // Example: https://processed-audio-demo-manager.s3.amazonaws.com/processed/[trackId]/mp3/[trackId].mp3
        // Change to: https://processed-audio-demo-manager.s3.amazonaws.com/processed/[trackId]/opus/[trackId].opus
        const opusUrl = mp3Url
          .replace('/mp3/', '/opus/')
          .replace('.mp3', '.opus');
        
        console.log(`Constructed potential Opus URL: ${opusUrl}`);
        
        // Add the constructed URL to the response
        responseData.opusUrl = opusUrl;
      }
    }
    
    // Log waveform peaks URL if available
    if (responseData.waveformPeaksUrl) {
      console.log(`Lambda returned waveform peaks URL: ${responseData.waveformPeaksUrl}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`Error calling FFmpeg Lambda service:`, error);
    throw new Error(`Lambda service error: ${error.message}`);
  }
}
