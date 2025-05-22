
import React, { createContext, ReactNode } from 'react';

// Define the context type
interface TrackPlayerContextType {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  handleTogglePlayPause: () => void;
}

// Create the context with a default value
export const TrackPlayerContext = createContext<TrackPlayerContextType>({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  handleTogglePlayPause: () => {}
});

interface TrackPlayerProviderProps {
  children: ReactNode;
  value: TrackPlayerContextType;
}

// Create the provider component
const TrackPlayerProvider: React.FC<TrackPlayerProviderProps> = ({ children, value }) => {
  return (
    <TrackPlayerContext.Provider value={value}>
      {children}
    </TrackPlayerContext.Provider>
  );
};

export default TrackPlayerProvider;
