
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
}

const defaultSettings: VisualizerSettings = {
  // Default display settings - enable just the 3 we need
  fftEnabled: true,
  oscilloscopeEnabled: true,
  spectrogramEnabled: true,
  stereoMeterEnabled: false,
  lufsEnabled: false,
  
  // General settings
  sensitivity: 1.0,
  
  // Layout settings
  gridLayout: 'row', // Default to row layout
  
  // FFT appearance settings - Updated to match the light blue from screenshot 2
  fftBarColor: '#8ADEFD', // Updated to match the color in the second screenshot
  
  // Oscilloscope settings - Updated to match screenshot 1
  oscilloscopeColor: '#7DE3FF', // Updated to match the blue from first screenshot
  oscilloscopeSensitivity: 1.5, // Default to 1.5x as shown in screenshot 1
  oscilloscopeLineWidth: 2, // Default to 2px as shown in screenshot 1
  oscilloscopeBackgroundColor: '#000000',
  oscilloscopeDrawMode: 'line',
  oscilloscopeDashPattern: [2, 2], // Dotted line pattern as shown in screenshot 1
  oscilloscopeFillColor: '#00FF00', // Updated to the green fill color from screenshot 1
  oscilloscopeFillOpacity: 0.0, // Default to 0 as shown in screenshot 1
  oscilloscopeInvertY: false,
};

export function useVisualizerSettings() {
  // Initialize state with default settings
  const [settings, setSettings] = useState<VisualizerSettings>(defaultSettings);
  
  // Toggle a boolean setting
  const toggleSetting = useCallback((key: keyof Pick<VisualizerSettings, 'fftEnabled' | 'oscilloscopeEnabled' | 'spectrogramEnabled' | 'stereoMeterEnabled' | 'lufsEnabled'>) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);
  
  // Update any setting
  const updateSetting = useCallback(<K extends keyof VisualizerSettings>(
    key: K,
    value: VisualizerSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  return {
    settings,
    toggleSetting,
    updateSetting
  };
}
