
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface VisualizerContainerProps {
  className?: string;
  children: React.ReactNode;
}

const VisualizerContainer: React.FC<VisualizerContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  const isMobile = useIsMobile();
  const visualizerHeight = isMobile ? 'h-[75px]' : 'h-[150px]';
  
  return (
    <div className={`relative overflow-hidden rounded-lg bg-wip-darker ${className}`} id="visualizer-container">
      <div className={`flex p-2 ${visualizerHeight}`}>
        {children}
      </div>
    </div>
  );
};

export default VisualizerContainer;
