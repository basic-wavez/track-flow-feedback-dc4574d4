
/**
 * Utility functions for handling audio files
 */

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
  // Remove extension and replace underscores/hyphens with spaces
  return fileName
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[_-]/g, " ") // Replace underscores and hyphens with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};

/**
 * Generate a placeholder for the waveform visualization
 * Used as a fallback when real audio analysis is not possible
 */
export const generateWaveformData = (length: number = 100): number[] => {
  const data = [];
  for (let i = 0; i < length; i++) {
    data.push(Math.random() * 0.5 + 0.25); // Values between 0.25 and 0.75
  }
  return data;
};

/**
 * Cache for waveform data to avoid reanalyzing the same audio files
 */
const waveformCache: Record<string, number[]> = {};

/**
 * Analyze audio file to extract waveform data
 * Returns a promise that resolves with an array of amplitude values
 */
export const analyzeAudio = async (audioUrl: string, samplesCount = 200): Promise<number[]> => {
  // Return cached waveform data if available
  if (waveformCache[audioUrl]) {
    console.log("Using cached waveform data for:", audioUrl);
    return waveformCache[audioUrl];
  }

  return new Promise((resolve, reject) => {
    console.log(`Starting audio analysis for ${audioUrl} with ${samplesCount} samples`);
    // Create audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.warn("AudioContext not supported - falling back to generated waveform");
      const fallbackData = generateWaveformData(samplesCount);
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
      const fallbackData = generateWaveformData(samplesCount);
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
        return audioContext.decodeAudioData(arrayBuffer);
      })
      .then(audioBuffer => {
        console.log(`Successfully decoded audio buffer: duration ${audioBuffer.duration}s, ${audioBuffer.numberOfChannels} channels`);
        // Get the audio data from the buffer
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        const blockSize = Math.floor(channelData.length / samplesCount);
        
        console.log(`Audio analysis: ${channelData.length} samples, block size ${blockSize}`);
        
        // First pass: Determine the maximum amplitude across the entire audio
        let maxAmplitude = 0;
        for (let i = 0; i < channelData.length; i++) {
          const sampleValue = Math.abs(channelData[i] || 0);
          maxAmplitude = Math.max(maxAmplitude, sampleValue);
        }
        
        console.log(`Maximum amplitude detected: ${maxAmplitude}`);
        
        // Process the audio data to create a waveform
        for (let i = 0; i < samplesCount; i++) {
          const startSample = blockSize * i;
          let sum = 0;
          let peakInBlock = 0;
          
          // Calculate both average and peak amplitude for this block
          // Using both helps create more visually interesting waveforms
          for (let j = 0; j < blockSize; j++) {
            const sampleValue = Math.abs(channelData[startSample + j] || 0);
            sum += sampleValue;
            peakInBlock = Math.max(peakInBlock, sampleValue);
          }
          
          // Use a mix of average and peak for better visualization
          // Give more weight to the peak for better dynamic range
          const avgAmplitude = sum / blockSize;
          const weightedAmplitude = (avgAmplitude * 0.5) + (peakInBlock * 0.5);
          
          // Normalize relative to the maximum amplitude detected
          // Apply a square root curve for better dynamic range (instead of cube root)
          // This will make quiet parts more quiet and preserve louder sections
          const normalizedValue = maxAmplitude > 0 ? weightedAmplitude / maxAmplitude : 0;
          
          // Use square root curve for less compression (was using cube root before)
          const curvedAmplitude = Math.pow(normalizedValue, 0.5);
          
          // Expand the range to show more dynamics (0.01 to 0.95 instead of 0.05 to 0.85)
          // Lower minimum makes quiet parts appear much quieter
          const finalAmplitude = 0.01 + (curvedAmplitude * 0.94);
          
          waveformData.push(finalAmplitude);
        }
        
        // Close the audio context when done
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(console.error);
        }
        
        // Cache the generated waveform data
        console.log(`Caching waveform data for: ${audioUrl}`);
        waveformCache[audioUrl] = waveformData;
        
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
        const fallbackData = generateWaveformData(samplesCount);
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
