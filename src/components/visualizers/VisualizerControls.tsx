
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  AudioWaveform, 
  Square, 
  Layers, 
  Sliders,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useVisualizer } from '@/context/VisualizerContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_THEMES } from '@/context/VisualizerContext';

interface VisualizerControlsProps {
  isExpanded: boolean;
  toggleExpand: () => void;
}

const VisualizerControls: React.FC<VisualizerControlsProps> = ({ 
  isExpanded,
  toggleExpand
}) => {
  const { 
    activeVisualizer, 
    setActiveVisualizer,
    themeKey,
    setThemeKey,
    fftSize,
    setFFTSize,
    showPeaks,
    setShowPeaks
  } = useVisualizer();
  
  const fftOptions = [512, 1024, 2048, 4096, 8192];
  
  // Function to get icon color based on active state
  const getIconColor = (visType: string) => {
    return activeVisualizer === visType ? 'text-wip-pink' : 'text-gray-400';
  };

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${getIconColor('spectrum')}`}
                onClick={() => setActiveVisualizer('spectrum')}
              >
                <BarChart size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Spectrum Analyzer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${getIconColor('oscilloscope')}`}
                onClick={() => setActiveVisualizer('oscilloscope')}
              >
                <AudioWaveform size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Oscilloscope</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${getIconColor('spectrogram')}`}
                onClick={() => setActiveVisualizer('spectrogram')}
              >
                <Layers size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Spectrogram</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Show/hide visualizer */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${activeVisualizer === 'none' ? 'text-wip-pink' : 'text-gray-400'}`}
                onClick={() => setActiveVisualizer(activeVisualizer === 'none' ? 'spectrum' : 'none')}
              >
                <Square size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{activeVisualizer === 'none' ? 'Show Visualizer' : 'Hide Visualizer'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Theme selector */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: DEFAULT_THEMES[themeKey as keyof typeof DEFAULT_THEMES]?.primary }}
                    />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change Theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end">
            {Object.entries(DEFAULT_THEMES).map(([key, theme]) => (
              <DropdownMenuItem 
                key={key}
                onClick={() => setThemeKey(key)}
                className="flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                <span className="capitalize">{key}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* FFT Size dropdown */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                    <Sliders size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Adjust Quality</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end">
            {fftOptions.map((size) => (
              <DropdownMenuItem 
                key={size}
                onClick={() => setFFTSize(size)}
                className={fftSize === size ? "bg-wip-pink/20" : ""}
              >
                {size === 512 ? 'Low Quality' : 
                 size === 8192 ? 'High Quality' : 
                 `${size} points`}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => setShowPeaks(!showPeaks)}
            >
              {showPeaks ? '✓ Show Peaks' : '○ Show Peaks'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Expand/collapse button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400"
                onClick={toggleExpand}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isExpanded ? 'Collapse' : 'Expand'} Visualizer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default VisualizerControls;
