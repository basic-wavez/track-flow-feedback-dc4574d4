
export interface LambdaProcessingRequest {
  trackId: string;
  format: string;
  signedUrl: string;
  generateWaveform?: boolean; // New parameter to request waveform generation
}

export interface LambdaProcessingResponse {
  trackId: string;
  mp3Url?: string;
  opusUrl?: string;
  waveformJsonUrl?: string; // New field for waveform data URL
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Calls the AWS Lambda FFmpeg service to process audio
 */
export async function callLambdaService(
  serviceUrl: string,
  apiKey: string,
  request: LambdaProcessingRequest
): Promise<LambdaProcessingResponse> {
  try {
    console.log(`Calling Lambda service at ${serviceUrl}`);
    
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lambda service returned status ${response.status}: ${errorText}`);
      throw new Error(`Lambda service error: ${response.status} ${errorText}`);
    }
    
    const data: LambdaProcessingResponse = await response.json();
    console.log(`Lambda service responded with:`, data);
    
    return data;
  } catch (error) {
    console.error('Error calling Lambda service:', error);
    throw error;
  }
}
