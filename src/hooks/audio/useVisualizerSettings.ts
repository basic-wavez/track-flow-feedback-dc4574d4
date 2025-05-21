
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
  
  // Appearance settings
  fftBarColor: string;
  oscilloscopeColor: string;
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
  
  // Appearance settings
  fftBarColor: '#9b87f5',
  oscilloscopeColor: '#34c759',
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
