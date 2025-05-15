
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
 * Analyze audio file to extract waveform data
 * Returns a promise that resolves with an array of amplitude values
 */
export const analyzeAudio = async (audioUrl: string, samplesCount = 200): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    // Create audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.warn("AudioContext not supported - falling back to generated waveform");
      resolve(generateWaveformData(samplesCount));
      return;
    }
    
    const audioContext = new AudioContext();
    const waveformData: number[] = [];
    
    // Fetch the audio file
    fetch(audioUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch audio file');
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        // Get the audio data from the buffer
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        const blockSize = Math.floor(channelData.length / samplesCount);
        
        // Process the audio data to create a waveform with peak detection
        for (let i = 0; i < samplesCount; i++) {
          const startSample = blockSize * i;
          let sum = 0;
          let peak = 0;
          
          // Calculate both average and peak amplitude for this block
          for (let j = 0; j < blockSize; j++) {
            const sampleValue = Math.abs(channelData[startSample + j] || 0);
            sum += sampleValue;
            peak = Math.max(peak, sampleValue);
          }
          
          // Use a weighted combination of average and peak for a more dynamic waveform
          const avgAmplitude = sum / blockSize;
          const weightedAmplitude = (avgAmplitude * 0.7) + (peak * 0.3);
          
          // Scale the amplitude and ensure minimum height for visibility
          // This creates more natural-looking peaks and valleys
          const amplitude = Math.max(0.05, Math.min(1, weightedAmplitude * 2.5));
          waveformData.push(amplitude);
        }
        
        // Apply smoothing to prevent jagged transitions between adjacent samples
        const smoothedData = smoothWaveform(waveformData, 2);
        
        // Close the audio context when done
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
        
        resolve(smoothedData);
      })
      .catch(error => {
        console.error("Error analyzing audio:", error);
        // Fall back to generated data
        console.warn("Using generated waveform data as fallback");
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
        resolve(generateWaveformData(samplesCount));
      });
  });
};

/**
 * Apply smoothing to the waveform data to prevent jagged transitions
 */
const smoothWaveform = (data: number[], radius: number): number[] => {
  if (radius <= 0 || data.length <= 1) return data;
  
  const result = [...data];
  
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;
    
    for (let j = Math.max(0, i - radius); j <= Math.min(data.length - 1, i + radius); j++) {
      sum += data[j];
      count++;
    }
    
    result[i] = sum / count;
  }
  
  return result;
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
