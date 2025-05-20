
import React from 'react';
import { VisualizerSettings } from '@/hooks/audio/useVisualizerSettings';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface VisualizerControlsProps {
  settings: VisualizerSettings;
  onToggleSetting: (key: keyof Pick<VisualizerSettings, 'fftEnabled' | 'oscilloscopeEnabled' | 'spectrogramEnabled' | 'stereoMeterEnabled' | 'lufsEnabled'>) => void;
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
  
  // Handler for grid layout selection
  const handleGridLayoutChange = (layout: '2x2' | '2x3' | '3x2') => {
    onUpdateSetting('gridLayout', layout);
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
          
          <div className="flex items-center justify-between">
            <label htmlFor="stereo-meter-toggle" className="text-xs">Stereo Meter</label>
            <Switch 
              id="stereo-meter-toggle"
              checked={settings.stereoMeterEnabled}
              onCheckedChange={() => onToggleSetting('stereoMeterEnabled')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="lufs-toggle" className="text-xs">LUFS Meter</label>
            <Switch 
              id="lufs-toggle"
              checked={settings.lufsEnabled}
              onCheckedChange={() => onToggleSetting('lufsEnabled')}
            />
          </div>
        </div>
        
        {/* Layout Selection */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-400">Grid Layout</h4>
          
          <div className="flex space-x-2">
            <Button 
              variant={settings.gridLayout === '2x2' ? "default" : "outline"} 
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => handleGridLayoutChange('2x2')}
            >
              2×2
            </Button>
            <Button 
              variant={settings.gridLayout === '2x3' ? "default" : "outline"} 
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => handleGridLayoutChange('2x3')}
            >
              2×3
            </Button>
            <Button 
              variant={settings.gridLayout === '3x2' ? "default" : "outline"} 
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => handleGridLayoutChange('3x2')}
            >
              3×2
            </Button>
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
