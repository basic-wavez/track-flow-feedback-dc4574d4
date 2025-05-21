
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
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from '@/components/ui/toggle-group';
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
  
  // Handler for oscilloscope sensitivity slider
  const handleOscilloscopeSensitivityChange = (value: number[]) => {
    onUpdateSetting('oscilloscopeSensitivity', value[0]);
  };
  
  // Handler for FFT color picker
  const handleFFTColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSetting('fftBarColor', e.target.value);
  };
  
  // Handler for oscilloscope color picker
  const handleOscilloscopeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSetting('oscilloscopeColor', e.target.value);
  };
  
  // Handler for oscilloscope background color picker
  const handleOscilloscopeBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSetting('oscilloscopeBackgroundColor', e.target.value);
  };
  
  // Handler for oscilloscope fill color picker
  const handleOscilloscopeFillColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSetting('oscilloscopeFillColor', e.target.value);
  };
  
  // Handler for oscilloscope line width
  const handleOscilloscopeLineWidthChange = (value: number[]) => {
    onUpdateSetting('oscilloscopeLineWidth', value[0]);
  };
  
  // Handler for oscilloscope fill opacity
  const handleOscilloscopeFillOpacityChange = (value: number[]) => {
    onUpdateSetting('oscilloscopeFillOpacity', value[0]);
  };
  
  // Handler for oscilloscope draw mode
  const handleOscilloscopeDrawModeChange = (value: string) => {
    onUpdateSetting('oscilloscopeDrawMode', value as 'line' | 'dots' | 'bars');
  };
  
  // Handler for oscilloscope invert Y
  const handleOscilloscopeInvertYChange = () => {
    onUpdateSetting('oscilloscopeInvertY', !settings.oscilloscopeInvertY);
  };
  
  // Handler for dash pattern settings
  const handleDashPatternChange = (value: string) => {
    if (value === 'none') {
      onUpdateSetting('oscilloscopeDashPattern', []);
    } else if (value === 'dashed') {
      onUpdateSetting('oscilloscopeDashPattern', [5, 5]);
    } else if (value === 'dotted') {
      onUpdateSetting('oscilloscopeDashPattern', [2, 2]);
    } else if (value === 'dashdot') {
      onUpdateSetting('oscilloscopeDashPattern', [10, 5, 2, 5]);
    }
  };

  return (
    <div className="absolute top-10 right-2 z-20 bg-wip-darker border border-gray-700 rounded-md shadow-lg p-4 w-72 max-h-[calc(100vh-150px)] overflow-y-auto">
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
        
        {/* Oscilloscope Settings Section */}
        {settings.oscilloscopeEnabled && (
          <div className="space-y-3 pt-2 border-t border-gray-800">
            <h4 className="text-xs font-semibold text-gray-400">Oscilloscope Settings</h4>
            
            {/* Oscilloscope Sensitivity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="oscilloscope-sensitivity" className="text-xs">Sensitivity</label>
                <span className="text-xs text-gray-500">{settings.oscilloscopeSensitivity?.toFixed(1) || '1.0'}×</span>
              </div>
              <Slider
                id="oscilloscope-sensitivity"
                value={[settings.oscilloscopeSensitivity || 1.0]} 
                min={0.1}
                max={3.0}
                step={0.1}
                onValueChange={handleOscilloscopeSensitivityChange}
              />
            </div>
            
            {/* Oscilloscope Line Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="oscilloscope-line-width" className="text-xs">Line Width</label>
                <span className="text-xs text-gray-500">{settings.oscilloscopeLineWidth || 2}px</span>
              </div>
              <Slider
                id="oscilloscope-line-width"
                value={[settings.oscilloscopeLineWidth || 2]} 
                min={1}
                max={10}
                step={1}
                onValueChange={handleOscilloscopeLineWidthChange}
              />
            </div>
            
            {/* Oscilloscope Draw Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="oscilloscope-draw-mode" className="text-xs">Draw Mode</label>
              </div>
              <Select 
                value={settings.oscilloscopeDrawMode || 'line'} 
                onValueChange={handleOscilloscopeDrawModeChange}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select draw mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="bars">Bars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Line Style (when in Line mode) */}
            {settings.oscilloscopeDrawMode === 'line' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="oscilloscope-line-style" className="text-xs">Line Style</label>
                </div>
                <ToggleGroup 
                  type="single" 
                  value={settings.oscilloscopeDashPattern?.length ? 
                    settings.oscilloscopeDashPattern.join(',') === '5,5' ? 'dashed' :
                    settings.oscilloscopeDashPattern.join(',') === '2,2' ? 'dotted' : 
                    settings.oscilloscopeDashPattern.join(',') === '10,5,2,5' ? 'dashdot' : 'none'
                    : 'none'
                  }
                  onValueChange={(value) => value && handleDashPatternChange(value)}
                  className="flex justify-between w-full"
                >
                  <ToggleGroupItem value="none" className="w-1/4 text-xs h-8">Solid</ToggleGroupItem>
                  <ToggleGroupItem value="dashed" className="w-1/4 text-xs h-8">Dashed</ToggleGroupItem>
                  <ToggleGroupItem value="dotted" className="w-1/4 text-xs h-8">Dotted</ToggleGroupItem>
                  <ToggleGroupItem value="dashdot" className="w-1/4 text-xs h-8">DashDot</ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
            
            {/* Fill Settings (when in Line mode) */}
            {settings.oscilloscopeDrawMode === 'line' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="oscilloscope-fill-opacity" className="text-xs">Fill Opacity</label>
                  <span className="text-xs text-gray-500">{settings.oscilloscopeFillOpacity?.toFixed(2) || '0.20'}</span>
                </div>
                <Slider
                  id="oscilloscope-fill-opacity"
                  value={[settings.oscilloscopeFillOpacity || 0.2]} 
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={handleOscilloscopeFillOpacityChange}
                />
              </div>
            )}
            
            {/* Invert Y toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="oscilloscope-invert-y" className="text-xs">Invert Y Axis</label>
              <Switch 
                id="oscilloscope-invert-y"
                checked={!!settings.oscilloscopeInvertY}
                onCheckedChange={handleOscilloscopeInvertYChange}
              />
            </div>
            
            {/* Color Pickers for Oscilloscope */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="oscilloscope-color" className="text-xs">Line Color</label>
                <div className="flex">
                  <input
                    id="oscilloscope-color"
                    type="color"
                    value={settings.oscilloscopeColor || '#34c759'}
                    onChange={handleOscilloscopeColorChange}
                    className="w-full h-8 border-0 p-0 bg-transparent"
                  />
                </div>
              </div>
              
              {settings.oscilloscopeDrawMode === 'line' && (
                <div className="space-y-1">
                  <label htmlFor="oscilloscope-fill-color" className="text-xs">Fill Color</label>
                  <div className="flex">
                    <input
                      id="oscilloscope-fill-color"
                      type="color"
                      value={settings.oscilloscopeFillColor || '#34c759'}
                      onChange={handleOscilloscopeFillColorChange}
                      className="w-full h-8 border-0 p-0 bg-transparent"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <label htmlFor="oscilloscope-background" className="text-xs">Background</label>
                <div className="flex">
                  <input
                    id="oscilloscope-background"
                    type="color"
                    value={settings.oscilloscopeBackgroundColor || '#000000'}
                    onChange={handleOscilloscopeBackgroundColorChange}
                    className="w-full h-8 border-0 p-0 bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* FFT and general settings */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
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
        </div>
      </div>
    </div>
  );
};

export default VisualizerControls;
