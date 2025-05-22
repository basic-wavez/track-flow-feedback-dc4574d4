
import { useIsMobile } from '@/hooks/use-mobile';
import { SpectrogramOptions } from '@/hooks/audio/types/spectrogramTypes';
import { useVisualizerSettings } from '@/hooks/audio/useVisualizerSettings';

// Define the BarVisConfig type that was missing
export interface BarVisConfig {
  barCount?: number;
  barColor?: string;
  capColor?: string;
  maxFrequency?: number;
  targetFPS?: number;
  smoothingFactor?: number;
  usePeaksData?: boolean;
}

export const useVisualizerConfig = () => {
  const isMobile = useIsMobile();
  const { settings } = useVisualizerSettings();
  
  // Set adjusted target FPS based on mobile status
  const targetFPS = isMobile ? 20 : 30;

  // Calculate appropriate FFT size based on device capability
  const spectrogramFftSize = isMobile ? 8192 : 32768;
  
  // FFT visualizer config
  const fftConfig: BarVisConfig = {
    barCount: isMobile ? 32 : (settings.fftBarCount || 64),
    barColor: settings.fftBarColor,
    capColor: settings.fftCapColor || '#000000',
    maxFrequency: settings.fftMaxFrequency || 15000,
    targetFPS: targetFPS,
    smoothingFactor: 0.7,
  };

  // Oscilloscope config
  const oscilloscopeConfig = {
    lineColor: settings.oscilloscopeColor,
    sensitivity: settings.oscilloscopeSensitivity || settings.sensitivity,
    lineWidth: settings.oscilloscopeLineWidth,
    backgroundColor: settings.oscilloscopeBackgroundColor || 'transparent',
    drawMode: settings.oscilloscopeDrawMode,
    dashPattern: settings.oscilloscopeDashPattern,
    fillColor: settings.oscilloscopeFillColor,
    fillOpacity: settings.oscilloscopeFillOpacity,
    invertY: settings.oscilloscopeInvertY,
    targetFPS: targetFPS,
  };
  
  // Spectrogram config
  const spectrogramConfig: SpectrogramOptions = {
    colorMid: settings.spectrogramColorMid || settings.fftBarColor,
    timeScale: isMobile ? (settings.spectrogramTimeScale || 10) * 0.5 : settings.spectrogramTimeScale || 10,
    maxFrequency: settings.spectrogramMaxFrequency || 15000,
    targetFPS: isMobile ? 15 : 20,
    bufferSize: isMobile ? 100 : 200,
    fftSize: spectrogramFftSize,
    smoothingTimeConstant: 0,
    minDecibels: -100,
    maxDecibels: -30,
    useLogScale: true,
    useDevicePixelRatio: true,
    colorMap: settings.spectrogramColorMap || 'magma',
  };

  return {
    fftConfig,
    oscilloscopeConfig,
    spectrogramConfig,
    settings
  };
};
