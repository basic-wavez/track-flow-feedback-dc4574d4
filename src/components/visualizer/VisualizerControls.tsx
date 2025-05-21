
import React from 'react';
import { VisualizerSettings } from '@/hooks/audio/useVisualizerSettings';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  
  // Handler for FFT cap color picker
  const handleFFTCapColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSetting('fftCapColor', e.target.value);
  };
  
  // Handler for FFT bar count slider
  const handleFFTBarCountChange = (value: number[]) => {
    onUpdateSetting('fftBarCount', value[0]);
  };
  
  // Handler for FFT max frequency slider
  const handleFFTMaxFrequencyChange = (value: number[]) => {
    onUpdateSetting('fftMaxFrequency', value[0]);
    // Also update spectrogram max frequency for consistency
    onUpdateSetting('spectrogramMaxFrequency', value[0]);
  };
  
  // Handler for spectrogram color picker
  const handleSpectrogramColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSetting('spectrogramColorMid', e.target.value);
  };
  
  // Handler for spectrogram time scale slider
  const handleSpectrogramTimeScaleChange = (value: number[]) => {
    onUpdateSetting('spectrogramTimeScale', value[0]);
  };

  return (
    <div className="fixed top-0 right-2 z-50 bg-wip-darker border border-gray-700 rounded-md shadow-lg p-4 w-72 max-h-[80vh] overflow-y-auto mt-2">
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
        
        {/* General Sensitivity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="sensitivity-slider" className="text-xs font-semibold text-gray-400">Global Sensitivity</label>
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
        
        {/* FFT Settings Section */}
        {settings.fftEnabled && (
          <div className="space-y-3 pt-2 border-t border-gray-800">
            <h4 className="text-xs font-semibold text-gray-400">FFT Spectrum Settings</h4>
            
            {/* FFT Bar Count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="fft-bar-count" className="text-xs">Bar Count</label>
                <span className="text-xs text-gray-500">{settings.fftBarCount || 64}</span>
              </div>
              <Slider
                id="fft-bar-count"
                value={[settings.fftBarCount || 64]} 
                min={16}
                max={128}
                step={8}
                onValueChange={handleFFTBarCountChange}
              />
            </div>
            
            {/* FFT Max Frequency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="fft-max-frequency" className="text-xs">Max Frequency</label>
                <span className="text-xs text-gray-500">{(settings.fftMaxFrequency || 15000) / 1000} kHz</span>
              </div>
              <Slider
                id="fft-max-frequency"
                value={[settings.fftMaxFrequency || 15000]} 
                min={5000}
                max={20000}
                step={1000}
                onValueChange={handleFFTMaxFrequencyChange}
              />
            </div>
            
            {/* FFT Colors */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="fft-color" className="text-xs">Bar Color</label>
                <div className="flex">
                  <input
                    id="fft-color"
                    type="color"
                    value={settings.fftBarColor}
                    onChange={handleFFTColorChange}
                    className="w-full h-8 border-0 p-0 bg-transparent"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label htmlFor="fft-cap-color" className="text-xs">Cap Color</label>
                <div className="flex">
                  <input
                    id="fft-cap-color"
                    type="color"
                    value={settings.fftCapColor || '#D946EF'}
                    onChange={handleFFTCapColorChange}
                    className="w-full h-8 border-0 p-0 bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Spectrogram Settings Section */}
        {settings.spectrogramEnabled && (
          <div className="space-y-3 pt-2 border-t border-gray-800">
            <h4 className="text-xs font-semibold text-gray-400">Spectrogram Settings</h4>
            
            {/* Spectrogram Time Scale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="spectrogram-time-scale" className="text-xs">Time Scale</label>
                <span className="text-xs text-gray-500">{settings.spectrogramTimeScale || 3}s</span>
              </div>
              <Slider
                id="spectrogram-time-scale"
                value={[settings.spectrogramTimeScale || 3]} 
                min={1}
                max={10}
                step={1}
                onValueChange={handleSpectrogramTimeScaleChange}
              />
            </div>
            
            {/* Spectrogram Color */}
            <div className="space-y-1">
              <label htmlFor="spectrogram-color" className="text-xs">Color</label>
              <div className="flex">
                <input
                  id="spectrogram-color"
                  type="color"
                  value={settings.spectrogramColorMid || settings.fftBarColor}
                  onChange={handleSpectrogramColorChange}
                  className="w-full h-8 border-0 p-0 bg-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizerControls;
