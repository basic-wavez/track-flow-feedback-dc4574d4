
import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from "react";

export type VisualizerType = 'none' | 'spectrum' | 'oscilloscope' | 'spectrogram';

interface VisualizerTheme {
  primary: string;
  secondary?: string;
  background?: string;
  lineColor?: string;
}

export const DEFAULT_THEMES = {
  purple: {
    primary: '#9b87f5',
    secondary: '#7E69AB',
    background: '#1A1F2C',
    lineColor: '#D6BCFA'
  },
  blue: {
    primary: '#0EA5E9',
    secondary: '#1EAEDB',
    background: '#0f172a',
    lineColor: '#D3E4FD'
  },
  green: {
    primary: '#10B981',
    secondary: '#34D399',
    background: '#064E3B',
    lineColor: '#F2FCE2'
  },
  pink: {
    primary: '#D946EF',
    secondary: '#F472B6',
    background: '#831843',
    lineColor: '#FFDEE2'
  },
  orange: {
    primary: '#F97316',
    secondary: '#FB923C',
    background: '#7C2D12',
    lineColor: '#FEC6A1'
  }
};

interface VisualizerContextType {
  activeVisualizer: VisualizerType;
  setActiveVisualizer: (type: VisualizerType) => void;
  theme: VisualizerTheme;
  themeKey: string;
  setThemeKey: (key: string) => void;
  fftSize: number;
  setFFTSize: (size: number) => void;
  showPeaks: boolean;
  setShowPeaks: (show: boolean) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const VisualizerContext = createContext<VisualizerContextType | undefined>(undefined);

export function VisualizerProvider({ children }: { children: ReactNode }) {
  const [activeVisualizer, setActiveVisualizer] = useState<VisualizerType>('spectrum');
  const [themeKey, setThemeKey] = useState<string>('purple');
  const [fftSize, setFFTSize] = useState<number>(2048);
  const [showPeaks, setShowPeaks] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  
  // Monitor document visibility to save resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  const theme = useMemo(() => {
    return DEFAULT_THEMES[themeKey as keyof typeof DEFAULT_THEMES] || DEFAULT_THEMES.purple;
  }, [themeKey]);
  
  const value = useMemo(() => ({
    activeVisualizer,
    setActiveVisualizer,
    theme,
    themeKey,
    setThemeKey,
    fftSize,
    setFFTSize,
    showPeaks,
    setShowPeaks,
    isVisible,
    setIsVisible
  }), [
    activeVisualizer, 
    theme,
    themeKey,
    fftSize,
    showPeaks,
    isVisible
  ]);

  return (
    <VisualizerContext.Provider value={value}>
      {children}
    </VisualizerContext.Provider>
  );
}

export function useVisualizer() {
  const context = useContext(VisualizerContext);
  if (context === undefined) {
    throw new Error("useVisualizer must be used within a VisualizerProvider");
  }
  return context;
}
