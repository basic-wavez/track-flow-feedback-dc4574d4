
import React from 'react';

interface VisualizerPanelProps {
  children: React.ReactNode;
  width?: string;
  enabled: boolean;
  type: string;
}

const VisualizerPanel: React.FC<VisualizerPanelProps> = ({ 
  children, 
  width = 'w-[40%]',
  enabled,
  type
}) => {
  return (
    <div className={`${width} rounded-md overflow-hidden bg-[#1A1A1A]`}>
      {enabled ? (
        <div className="h-full">
          {children}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
          {type} disabled
        </div>
      )}
    </div>
  );
};

export default VisualizerPanel;
