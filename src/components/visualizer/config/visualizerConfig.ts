
import { useVisualizerSettings } from '@/hooks/audio/useVisualizerSettings';
import { useIsMobile } from '@/hooks/use-mobile';

export function useVisualizerConfig() {
  const { settings } = useVisualizerSettings();
  const isMobile = useIsMobile();

  // Configure oscilloscope options based on settings
  const oscilloscopeConfig = {
    lineColor: settings.oscilloscopeColor, // This will now use #E7A2C8
    lineWidth: settings.oscilloscopeLineWidth,
    backgroundColor: settings.oscilloscopeBackgroundColor,
    sensitivity: settings.oscilloscopeSensitivity,
    drawMode: settings.oscilloscopeDrawMode,
    dashPattern: settings.oscilloscopeDashPattern,
    fillColor: settings.oscilloscopeFillColor,
    fillOpacity: settings.oscilloscopeFillOpacity,
    invertY: settings.oscilloscopeInvertY,
    targetFPS: 30, // Lower FPS for better performance
  };

  return {
    oscilloscopeConfig
  };
}
