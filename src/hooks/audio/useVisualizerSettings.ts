
import { useState, useEffect } from 'react';

export interface VisualizerSettings {
  fftEnabled: boolean;
  oscilloscopeEnabled: boolean;
  spectrogramEnabled: boolean;
  stereoMeterEnabled: boolean;
  lufsEnabled: boolean;
  sensitivity: number;
  fftBarColor: string;
  oscilloscopeColor: string;
  gridLayout: '2x2' | '2x3' | '3x2';
}

const DEFAULT_SETTINGS: VisualizerSettings = {
  fftEnabled: true,
  oscilloscopeEnabled: true,
  spectrogramEnabled: true,
  stereoMeterEnabled: true,
  lufsEnabled: true,
  sensitivity: 1.0,
  fftBarColor: '#9b87f5',
  oscilloscopeColor: '#34c759',
  gridLayout: '2x3',
};

// LocalStorage key
const STORAGE_KEY = 'audio-visualizer-settings';

export function useVisualizerSettings() {
  const [settings, setSettings] = useState<VisualizerSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load visualizer settings:', error);
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save visualizer settings:', error);
    }
  }, [settings, isLoaded]);

  // Method to update a single setting
  const updateSetting = <K extends keyof VisualizerSettings>(
    key: K,
    value: VisualizerSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Method to toggle a boolean setting
  const toggleSetting = (key: keyof Pick<VisualizerSettings, 
    'fftEnabled' | 'oscilloscopeEnabled' | 'spectrogramEnabled' | 'stereoMeterEnabled' | 'lufsEnabled'
  >) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    toggleSetting,
    resetSettings,
    isLoaded
  };
}
