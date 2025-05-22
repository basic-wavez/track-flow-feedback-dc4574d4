
import React, { createContext, useContext, useState } from 'react';

interface PeaksDataContextType {
  peaksData: number[] | null;
  setPeaksData: (data: number[] | null) => void;
  hasPeaksData: boolean;
}

const PeaksDataContext = createContext<PeaksDataContextType>({
  peaksData: null,
  setPeaksData: () => {},
  hasPeaksData: false
});

export const PeaksDataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [peaksData, setPeaksData] = useState<number[] | null>(null);
  
  const value = {
    peaksData,
    setPeaksData,
    hasPeaksData: peaksData !== null && peaksData.length > 0
  };
  
  return (
    <PeaksDataContext.Provider value={value}>
      {children}
    </PeaksDataContext.Provider>
  );
};

export const usePeaksData = () => useContext(PeaksDataContext);

export default PeaksDataContext;
