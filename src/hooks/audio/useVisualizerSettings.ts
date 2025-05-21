
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
  spectrogramUseLogScale?: boolean; // New setting for log scale
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
  fftBarCount: 32, // 32 bars from screenshot
  fftCapColor: '#000000', // Black color from screenshot
  
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
  
  // Spectrogram settings - updated to match screenshot
  spectrogramColorMid: '#8ADEFD', // Light blue color from screenshot
  spectrogramTimeScale: 10, // 10s from screenshot
  spectrogramMaxFrequency: 15000, // Match FFT max frequency
  spectrogramUseLogScale: true, // Enable logarithmic frequency scale by default
};

export function useVisualizerSettings() {
  // Initialize state with default settings
  const [settings] = useState<VisualizerSettings>(defaultSettings);
  
  // Return only the settings - no methods to modify them since controls are removed
  return {
    settings
  };
}
