/**
 * Utility functions for handling audio files
 */

import { generateWaveformWithVariance } from '@/lib/waveformUtils';

/**
 * Check if the file is an allowed audio format
 */
export const isAllowedAudioFormat = (file: File): boolean => {
  const allowedTypes = [
    'audio/mpeg', // MP3
    'audio/wav', // WAV
    'audio/x-wav',
    'audio/flac', // FLAC
    'audio/x-flac',
    'audio/aiff', // AIFF
    'audio/x-aiff',
    'audio/x-m4a', // M4A/AAC
    'audio/mp4',
    'audio/aac'
  ];
  
  return allowedTypes.includes(file.type);
};

/**
 * Check if the file is natively playable in browsers
 * WAV, MP3 and AAC/MP4 are generally supported in modern browsers
 */
export const isNativelyPlayable = (fileType: string | undefined): boolean => {
  if (!fileType) return false;
  
  const nativelyPlayable = [
    'audio/mpeg', // MP3
    'audio/wav', // WAV
    'audio/x-wav',
    'audio/mp4', // AAC/MP4
    'audio/aac',
    'audio/x-m4a'
  ];
  
  return nativelyPlayable.includes(fileType);
};

/**
 * Determine if a processing indicator should be shown based on file type and availability of processed versions
 */
export const needsProcessingIndicator = (
  originalFileType: string | undefined, 
  mp3Url: string | undefined | null,
  opusUrl: string | undefined | null,
  processingStatus: string | undefined
): boolean => {
  // If MP3 or Opus is available, we don't need the indicator
  if (mp3Url || opusUrl) return false;
  
  // If file is natively playable and not being processed, no need for indicator
  if (isNativelyPlayable(originalFileType) && processingStatus !== 'processing') return false;
  
  // If processing is completed but we still don't have URLs, something went wrong
  if (processingStatus === 'completed') return false;
  
  // Otherwise, we need the indicator
  return true;
};

/**
 * Helper to get file type from URL or filename
 */
export const getFileTypeFromUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  
  const extension = url.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'flac':
      return 'audio/flac';
    case 'aiff':
    case 'aif':
      return 'audio/aiff';
    case 'mp4':
    case 'm4a':
      return 'audio/mp4';
    case 'opus':
      return 'audio/opus';
    default:
      return undefined;
  }
};

/**
 * Check if the file is a lossless format
 */
export const isLosslessFormat = (file: File): boolean => {
  const losslessTypes = [
    'audio/wav',
    'audio/x-wav',
    'audio/flac',
    'audio/x-flac',
    'audio/aiff',
    'audio/x-aiff'
  ];
  
  return losslessTypes.includes(file.type);
};

/**
 * Extract track name from file name
 */
export const extractTrackName = (fileName: string): string => {
  // Only remove the file extension, preserve all other characters and formatting
  return fileName.replace(/\.[^/.]+$/, "");
};

/**
 * Generate a placeholder for the waveform visualization
 * Used as a fallback when real audio analysis is not possible
 */
export const generateWaveformData = (length: number = 100): number[] => {
  const data = [];
  for (let i = 0; i < length; i++) {
    // Reduced amplitude values between 0.15 and 0.5 (was 0.25 and 0.75)
    data.push(Math.random() * 0.35 + 0.15); 
  }
  return data;
};

/**
 * Cache settings for waveform data
 */
const CACHE_VERSION = 'v1';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Memory cache for waveform data during the current session
 */
const waveformMemoryCache: Record<string, number[]> = {};

/**
 * Generate a cache key for the audio URL
 * This helps ensure we have a unique identifier for each audio file
 */
const generateCacheKey = (audioUrl: string): string => {
  // Extract unique identifiers from the URL
  const urlParts = audioUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  
  // Create a composite key with version to allow for future cache invalidation
  return `waveform_${CACHE_VERSION}_${fileName}`;
};

/**
 * Helper to detect if a URL is likely to be an MP3
 * This helps ensure we prioritize MP3 for waveform analysis
 */
const isLikelyMp3 = (url: string): boolean => {
  return url.toLowerCase().includes('.mp3') || url.includes('mp3_url');
};

/**
 * Save waveform data to localStorage
 */
const saveWaveformToStorage = (key: string, data: number[]): void => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(key, JSON.stringify(cacheItem));
    console.log(`Saved waveform data to localStorage with key: ${key}`);
  } catch (error) {
    console.warn('Failed to save waveform data to localStorage:', error);
    // Silently fail - localStorage might be full or disabled
  }
};

/**
 * Load waveform data from localStorage
 * Returns null if the data is not found or expired
 */
const loadWaveformFromStorage = (key: string): number[] | null => {
  try {
    const cachedItem = localStorage.getItem(key);
    
    if (!cachedItem) {
      return null;
    }
    
    const { data, timestamp } = JSON.parse(cachedItem);
    
    // Check if the cache has expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      console.log(`Cache expired for key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }
    
    console.log(`Loaded waveform data from localStorage with key: ${key}`);
    return data;
  } catch (error) {
    console.warn('Failed to load waveform data from localStorage:', error);
    return null;
  }
};

/**
 * Analyze audio file to extract waveform data
 * Returns a promise that resolves with an array of amplitude values
 * Enhanced for more dynamic visualization with emphasized peaks but overall reduced amplitude
 */
export const analyzeAudio = async (audioUrl: string, samplesCount = 250): Promise<number[]> => {
  // Generate a cache key for this audio URL
  const cacheKey = generateCacheKey(audioUrl);
  
  // Check memory cache first (fastest)
  if (waveformMemoryCache[audioUrl]) {
    console.log("Using in-memory cached waveform data for:", audioUrl);
    return waveformMemoryCache[audioUrl];
  }
  
  // Then check localStorage (persists between page loads)
  const storedData = loadWaveformFromStorage(cacheKey);
  if (storedData) {
    // Save to memory cache for faster access next time
    waveformMemoryCache[audioUrl] = storedData;
    return storedData;
  }

  // Log whether we're analyzing an MP3 or not
  const isMp3 = isLikelyMp3(audioUrl);
  console.log(`Analyzing audio ${isMp3 ? 'MP3' : 'non-MP3'} from URL:`, audioUrl);
  
  return new Promise((resolve, reject) => {
    console.log(`Starting audio analysis for ${audioUrl} with ${samplesCount} samples`);
    // Create audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.warn("AudioContext not supported - falling back to generated waveform");
      const fallbackData = generateWaveformWithVariance(samplesCount, 0.6);
      resolve(fallbackData);
      return;
    }
    
    const audioContext = new AudioContext();
    const waveformData: number[] = [];
    
    // Set a timeout to abort if it takes too long
    const timeoutId = setTimeout(() => {
      if (audioContext.state !== 'closed') {
        audioContext.close().catch(console.error);
      }
      console.warn("Audio analysis timed out - using fallback data");
      const fallbackData = generateWaveformWithVariance(samplesCount, 0.6);
      resolve(fallbackData);
    }, 30000); // 30 second timeout - increased for larger files
    
    // Fetch the audio file with cache control headers
    fetch(audioUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      cache: 'reload' // Force fetch from network
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
        }
        console.log(`Successfully fetched audio file: ${audioUrl}`);
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        clearTimeout(timeoutId); // Clear timeout as we've received data
        console.log(`Decoding audio data: ${arrayBuffer.byteLength} bytes`);
        
        // Check if we actually got data
        if (arrayBuffer.byteLength === 0) {
          throw new Error('Received empty audio file');
        }
        
        return audioContext.decodeAudioData(arrayBuffer)
          .catch(decodeError => {
            console.error('Browser failed to decode audio data:', decodeError);
            
            // If this isn't an MP3 and decode failed, we'll throw an error
            if (!isMp3) {
              throw new Error(`Browser couldn't decode this audio format. Try using an MP3 version.`);
            } else {
              throw decodeError; // Re-throw for MP3s
            }
          });
      })
      .then(audioBuffer => {
        console.log(`Successfully decoded audio buffer: duration ${audioBuffer.duration}s, ${audioBuffer.numberOfChannels} channels`);
        // Get the audio data from the buffer
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        const blockSize = Math.floor(channelData.length / samplesCount);
        
        console.log(`Audio analysis: ${channelData.length} samples, block size ${blockSize}`);
        
        // First pass: Determine the maximum amplitude across the entire audio
        // and also calculate RMS (root mean square) for a better sense of loudness
        let maxAmplitude = 0;
        let totalRMS = 0;
        
        for (let i = 0; i < channelData.length; i++) {
          const sampleValue = Math.abs(channelData[i] || 0);
          maxAmplitude = Math.max(maxAmplitude, sampleValue);
          totalRMS += sampleValue * sampleValue;
        }
        
        const rmsAmplitude = Math.sqrt(totalRMS / channelData.length);
        console.log(`Maximum amplitude detected: ${maxAmplitude}, RMS amplitude: ${rmsAmplitude}`);
        
        // Calculate a dynamic threshold for peak emphasis
        const thresholdRatio = rmsAmplitude / maxAmplitude;
        const dynamicThreshold = rmsAmplitude * (thresholdRatio < 0.1 ? 2.5 : 1.5);
        
        // Amplitude reduction factor (approximately 2/3 of original)
        const amplitudeReductionFactor = 0.67;
        
        // Process the audio data to create a waveform
        for (let i = 0; i < samplesCount; i++) {
          const startSample = blockSize * i;
          let sum = 0;
          let peakInBlock = 0;
          let sumOfSquares = 0;
          
          // Calculate more detailed metrics for this block
          for (let j = 0; j < blockSize; j++) {
            const sampleValue = Math.abs(channelData[startSample + j] || 0);
            sum += sampleValue;
            sumOfSquares += sampleValue * sampleValue;
            peakInBlock = Math.max(peakInBlock, sampleValue);
          }
          
          // Calculate block RMS for a better loudness measure
          const blockRMS = Math.sqrt(sumOfSquares / blockSize);
          const avgAmplitude = sum / blockSize;
          
          // Use a weighted combination with emphasis on peaks
          // Adjust weights to emphasize peaks more (now 70% peak, 30% RMS)
          const weightedAmplitude = (blockRMS * 0.3) + (peakInBlock * 0.7);
          
          // Emphasize peaks above the dynamic threshold (accentuates the dynamics)
          const isPeak = peakInBlock > dynamicThreshold;
          const peakEmphasis = isPeak ? 0.2 : 0;
          
          // Normalize with the enhanced peak emphasis
          const normalizedValue = maxAmplitude > 0 
            ? (weightedAmplitude / maxAmplitude) + peakEmphasis 
            : 0;
          
          // Apply a more aggressive curve for better dynamic range
          // Now using a square root curve with a bias toward higher values
          const dynamicBias = 0.85; // Higher values accentuate peaks
          const curvedAmplitude = Math.pow(normalizedValue * dynamicBias, 0.5);
          
          // Reduce overall amplitude to about 2/3 of original
          const reducedAmplitude = curvedAmplitude * amplitudeReductionFactor;
          
          // Expand the range but with reduced maximum (0.01 to 0.65)
          const finalAmplitude = 0.01 + (reducedAmplitude * 0.64);
          
          // Add some additional variance to nearby segments for more natural appearance
          const neighborFactor = i > 0 ? waveformData[i-1] * 0.2 : 0;
          const natural = Math.max(0.01, Math.min(0.65, finalAmplitude + (neighborFactor - 0.1)));
          
          waveformData.push(natural);
        }
        
        // Perform a post-processing pass to enhance dynamics further
        // Find average amplitude to determine a threshold
        const avgWaveformAmplitude = waveformData.reduce((sum, val) => sum + val, 0) / waveformData.length;
        
        // Enhance the contrast in the waveform
        for (let i = 0; i < waveformData.length; i++) {
          const current = waveformData[i];
          
          // Apply a non-linear curve that emphasizes both peaks and valleys
          if (current > avgWaveformAmplitude * 1.2) {
            // Boost high peaks even more, but stay within reduced amplitude range
            waveformData[i] = Math.min(0.65, current * 1.15);
          } else if (current < avgWaveformAmplitude * 0.8) {
            // Make quiet parts even quieter
            waveformData[i] = current * 0.85;
          }
        }
        
        // Close the audio context when done
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(console.error);
        }
        
        // Cache the generated waveform data in memory
        console.log(`Caching waveform data for: ${audioUrl}`);
        waveformMemoryCache[audioUrl] = waveformData;
        
        // Also save to localStorage for persistence between page loads
        saveWaveformToStorage(cacheKey, waveformData);
        
        resolve(waveformData);
      })
      .catch(error => {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error(`Error analyzing audio ${audioUrl}:`, error);
        
        // Fall back to generated data
        console.warn("Using generated waveform data as fallback");
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(console.error);
        }
        const fallbackData = generateWaveformWithVariance(samplesCount, 0.6);
        resolve(fallbackData);
      });
  });
};

/**
 * Simulated function to compress an audio file
 * In a real app, this would handle actual audio compression
 */
export const compressAudioFile = async (file: File): Promise<{ success: boolean, message: string }> => {
  // This is a simulation - in a real app you'd process the file with something like ffmpeg.wasm
  // or use a backend service for compression
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
  
  // For demo purposes, we're just simulating successful compression
  return {
    success: true,
    message: `File ${file.name} has been compressed.`
  };
};

/**
 * Clear expired cache entries from localStorage
 */
export const cleanupExpiredCache = (): void => {
  try {
    Object.keys(localStorage).forEach(key => {
      // Only process our waveform cache keys
      if (key.startsWith(`waveform_${CACHE_VERSION}_`)) {
        try {
          const cachedItem = localStorage.getItem(key);
          if (cachedItem) {
            const { timestamp } = JSON.parse(cachedItem);
            
            // Remove if expired
            if (Date.now() - timestamp > CACHE_EXPIRY) {
              localStorage.removeItem(key);
              console.log(`Removed expired cache item: ${key}`);
            }
          }
        } catch (e) {
          // If the item is malformed, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Error cleaning up expired cache:', error);
  }
};

// Run cache cleanup when the module loads
cleanupExpiredCache();
