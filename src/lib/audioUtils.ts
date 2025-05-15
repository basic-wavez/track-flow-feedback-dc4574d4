
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
        
        // Process the audio data to create a waveform
        for (let i = 0; i < samplesCount; i++) {
          const startSample = blockSize * i;
          let sum = 0;
          
          // Calculate the average amplitude for this block
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[startSample + j] || 0);
          }
          
          // Normalize between 0-1 with minimum value to ensure visibility
          const amplitude = Math.max(0.05, Math.min(1, sum / blockSize * 3));
          waveformData.push(amplitude);
        }
        
        // Close the audio context when done
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
        
        resolve(waveformData);
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
