
/**
 * Utility functions for handling storage URLs and signed URLs
 */

/**
 * Parse a storage URL to extract bucket name and file path
 * @param url The storage URL to parse
 * @returns Object containing bucket name and file path
 */
export interface ParsedStorageUrl {
  bucketName: string;
  filePath: string;
}

/**
 * Parses a Supabase storage URL to extract bucket name and file path
 */
export function parseStorageUrl(url: string): ParsedStorageUrl {
  try {
    if (!url) {
      throw new Error("URL is empty or undefined");
    }
    
    console.log(`Attempting to parse URL: ${url}`);
    
    // Parse storage URL to extract bucket and path
    // This supports both the standard format and variations
    const standardPattern = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;
    const alternatePattern = /\/storage\/v1\/object\/sign\/([^\/]+)\/(.+)$/;
    const s3Pattern = /s3\.amazonaws\.com\/([\w-]+)\/(.+)$/;
    
    let match = url.match(standardPattern);
    
    if (!match || match.length !== 3) {
      // Try alternate pattern
      match = url.match(alternatePattern);
    }
    
    if (!match || match.length !== 3) {
      // Try S3 pattern
      match = url.match(s3Pattern);
    }
    
    if (match && match.length === 3) {
      const result = {
        bucketName: match[1], // First capture group is the bucket name
        filePath: match[2],   // Second capture group is the file path
      };
      
      console.log(`Successfully parsed URL. Bucket: ${result.bucketName}, Path: ${result.filePath}`);
      return result;
    }
    
    // If we reach here, no pattern matched
    console.error(`URL format not recognized: ${url}`);
    throw new Error(`Invalid storage URL format: ${url}`);
  } catch (error) {
    console.error(`Error parsing URL ${url}:`, error);
    throw new Error(`Failed to parse storage URL: ${error.message}`);
  }
}

/**
 * Ensures a URL is a full URL with domain
 * @param url URL or path
 * @param baseUrl Base domain URL
 * @returns Full URL
 */
export function ensureFullUrl(url: string, baseUrl: string): string {
  try {
    if (!url) {
      throw new Error("URL is empty or undefined");
    }
    
    // If it's already a full URL, return it
    if (url.startsWith('http')) {
      return url;
    }
    
    // If the url starts with a slash, remove it for consistency
    const normalizedPath = url.startsWith('/') ? url.substring(1) : url;
    
    // Ensure baseUrl doesn't end with a slash
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Construct the full URL
    const fullUrl = `${normalizedBaseUrl}/storage/v1/object/public/${normalizedPath}`;
    console.log(`Converted relative URL to full URL: ${fullUrl}`);
    return fullUrl;
  } catch (error) {
    console.error(`Error ensuring full URL (${url}):`, error);
    // Return the original URL as a fallback
    return url;
  }
}

/**
 * Create a URL pointing to a processed file in the S3 bucket
 * @param trackId Track ID
 * @param format Format (mp3 or opus)
 * @param baseUrl Base S3 bucket URL
 * @returns Full URL to the processed file
 */
export function constructProcessedFileUrl(
  trackId: string,
  format: 'mp3' | 'opus',
  baseUrl: string = "https://processed-audio-demo-manager.s3.amazonaws.com"
): string {
  const extension = format === 'mp3' ? 'mp3' : 'opus';
  const path = `processed/${trackId}/${format}/${trackId}.${extension}`;
  
  // Ensure baseUrl doesn't end with a slash
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return `${normalizedBaseUrl}/${path}`;
}

/**
 * Creates an error object with contextual information for failed operations
 * @param message Error message
 * @param context Additional context for the error
 * @returns Formatted error object
 */
export function createStorageError(message: string, context: any = {}): Error {
  const error = new Error(message);
  (error as any).context = context;
  return error;
}
