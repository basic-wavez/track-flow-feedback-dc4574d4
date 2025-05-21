
import React from 'react';
import { VisualizerSettings } from '@/hooks/audio/useVisualizerSettings';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface VisualizerControlsProps {
  settings: VisualizerSettings;
  onToggleSetting: (key: keyof Pick<VisualizerSettings, 'fftEnabled' | 'oscilloscopeEnabled' | 'spectrogramEnabled'>) => void;
  onUpdateSetting: <K extends keyof VisualizerSettings>(key: K, value: VisualizerSettings[K]) => void;
  onClose: () => void;
}

const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  settings,
  onToggleSetting,
  onUpdateSetting,
  onClose
}) => {
  // Handler for sensitivity slider
  const handleSensitivityChange = (value: number[]) => {
    onUpdateSetting('sensitivity', value[0]);
  };
  
  // Handler for FFT color picker
  const handleFFTColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSetting('fftBarColor', e.target.value);
  };
  
  // Handler for oscilloscope color picker
  const handleOscilloscopeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSetting('oscilloscopeColor', e.target.value);
  };

  return (
    <div className="absolute top-10 right-2 z-20 bg-wip-darker border border-gray-700 rounded-md shadow-lg p-4 w-64 max-h-[calc(100vh-150px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-wip-pink">Visualizer Settings</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X size={16} />
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Visualizer Toggles */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-400">Display Options</h4>
          
          <div className="flex items-center justify-between">
            <label htmlFor="fft-toggle" className="text-xs">FFT Spectrum</label>
            <Switch 
              id="fft-toggle"
              checked={settings.fftEnabled}
              onCheckedChange={() => onToggleSetting('fftEnabled')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="oscilloscope-toggle" className="text-xs">Oscilloscope</label>
            <Switch 
              id="oscilloscope-toggle"
              checked={settings.oscilloscopeEnabled}
              onCheckedChange={() => onToggleSetting('oscilloscopeEnabled')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="spectrogram-toggle" className="text-xs">Spectrogram</label>
            <Switch 
              id="spectrogram-toggle"
              checked={settings.spectrogramEnabled}
              onCheckedChange={() => onToggleSetting('spectrogramEnabled')}
            />
          </div>
        </div>
        
        {/* Sensitivity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="sensitivity-slider" className="text-xs font-semibold text-gray-400">Sensitivity</label>
            <span className="text-xs text-gray-500">{settings.sensitivity.toFixed(1)}×</span>
          </div>
          
          <Slider
            id="sensitivity-slider"
            value={[settings.sensitivity]} 
            min={0.1}
            max={2.0}
            step={0.1}
            onValueChange={handleSensitivityChange}
          />
        </div>
        
        {/* Color Pickers */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-400">Colors</h4>
          
          <div className="flex items-center justify-between">
            <label htmlFor="fft-color" className="text-xs">FFT Color</label>
            <input
              id="fft-color"
              type="color"
              value={settings.fftBarColor}
              onChange={handleFFTColorChange}
              className="w-6 h-6 border-0 p-0 bg-transparent cursor-pointer"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="oscilloscope-color" className="text-xs">Oscilloscope Color</label>
            <input
              id="oscilloscope-color"
              type="color"
              value={settings.oscilloscopeColor}
              onChange={handleOscilloscopeColorChange}
              className="w-6 h-6 border-0 p-0 bg-transparent cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizerControls;
