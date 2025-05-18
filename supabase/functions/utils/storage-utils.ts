
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
    // Parse storage URL to extract bucket and path
    const urlPattern = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/;
    const match = url.match(urlPattern);
    
    if (match && match.length === 3) {
      return {
        bucketName: match[1], // First capture group is the bucket name
        filePath: match[2],   // Second capture group is the file path
      };
    }
    
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
  if (url.startsWith('http')) {
    return url;
  }
  // If it's just a path, construct the full URL
  return `${baseUrl}/storage/v1/object/public/${url}`;
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
