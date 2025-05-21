
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
  
  // FFT appearance settings
  fftBarColor: '#9b87f5',
  
  // Oscilloscope settings
  oscilloscopeColor: '#34c759',
  oscilloscopeSensitivity: 1.0,
  oscilloscopeLineWidth: 2,
  oscilloscopeBackgroundColor: '#000000',
  oscilloscopeDrawMode: 'line',
  oscilloscopeDashPattern: [],
  oscilloscopeFillColor: '#34c759',
  oscilloscopeFillOpacity: 0.2,
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
