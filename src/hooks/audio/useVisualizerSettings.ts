
import { useState, useCallback } from 'react';

export interface VisualizerSettings {
  // Display toggles
  fftEnabled: boolean;
  oscilloscopeEnabled: boolean;
  spectrogramEnabled: boolean;
  stereoMeterEnabled: boolean;
  lufsEnabled: boolean;
  
  // General settings
  sensitivity: number;
  
  // Layout settings
  gridLayout: '2x2' | '2x3' | '3x2' | 'row'; // Added 'row' option for new layout
  
  // FFT appearance settings
  fftBarColor: string;
  fftMaxFrequency?: number;
  fftBarCount?: number;
  fftCapColor?: string;
  fftSmoothingFactor?: number; // New setting for EMA smoothing
  
  // Oscilloscope settings
  oscilloscopeColor: string;
  oscilloscopeSensitivity?: number;
  oscilloscopeLineWidth?: number;
  oscilloscopeBackgroundColor?: string;
  oscilloscopeDrawMode?: 'line' | 'dots' | 'bars';
  oscilloscopeDashPattern?: number[];
  oscilloscopeFillColor?: string;
  oscilloscopeFillOpacity?: number;
  oscilloscopeInvertY?: boolean;
  
  // Spectrogram settings
  spectrogramColorMid?: string;
  spectrogramTimeScale?: number;
  spectrogramMaxFrequency?: number;
  spectrogramUseLogScale?: boolean;
  spectrogramColorMap?: 'default' | 'inferno' | 'magma' | 'turbo'; // Color map options
}

const defaultSettings: VisualizerSettings = {
  // Default display settings - all enabled by default
  fftEnabled: true,
  oscilloscopeEnabled: true,
  spectrogramEnabled: true,
  stereoMeterEnabled: false,
  lufsEnabled: false,
  
  // General settings - updated to match screenshot
  sensitivity: 1.0, // From screenshot - 1.0×
  
  // Layout settings
  gridLayout: 'row', // Default to row layout
  
  // FFT appearance settings - Updated to match screenshot
  fftBarColor: '#8ADEFD', // Light blue color from screenshot
  fftMaxFrequency: 15000, // 15 kHz from screenshot
  fftBarCount: 64, // Increased from 32 to 64 for better resolution with mel bands
  fftCapColor: '#000000', // Black color from screenshot
  fftSmoothingFactor: 0.7, // New default smoothing factor for EMA
  
  // Oscilloscope settings
  oscilloscopeColor: '#7DE3FF', // Light blue 
  oscilloscopeSensitivity: 1.5, 
  oscilloscopeLineWidth: 2,
  oscilloscopeBackgroundColor: '#000000',
  oscilloscopeDrawMode: 'line',
  oscilloscopeDashPattern: [], // Empty array for solid lines
  oscilloscopeFillColor: '#00FF00',
  oscilloscopeFillOpacity: 0.0,
  oscilloscopeInvertY: false,
  
  // Spectrogram settings - updated to match screenshot and maintain the time scale
  spectrogramColorMid: '#8ADEFD', // Light blue color from screenshot
  spectrogramTimeScale: 5, // Keep at 5 as this is working well with our updated logarithmic scaling
  spectrogramMaxFrequency: 15000, // Match FFT max frequency
  spectrogramUseLogScale: true, // Enable logarithmic frequency scale by default
  spectrogramColorMap: 'magma', // Use magma as the default perceptual color map
};

export function useVisualizerSettings() {
  // Initialize state with default settings
  const [settings] = useState<VisualizerSettings>(defaultSettings);
  
  // Return only the settings - no methods to modify them since controls are removed
  return {
    settings
  };
}
