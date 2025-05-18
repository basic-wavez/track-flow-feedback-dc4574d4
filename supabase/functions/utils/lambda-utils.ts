
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
    
    return responseData;
  } catch (error) {
    console.error(`Error calling FFmpeg Lambda service:`, error);
    throw new Error(`Lambda service error: ${error.message}`);
  }
}
