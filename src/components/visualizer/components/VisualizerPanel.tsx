
import React from 'react';

interface VisualizerPanelProps {
  children: React.ReactNode;
  width?: string;
  enabled: boolean;
  type: string;
  title?: string;  // Add the title prop
  active?: boolean; // Add active prop
  loading?: boolean; // Add loading prop
  error?: Error; // Add error prop
}

const VisualizerPanel: React.FC<VisualizerPanelProps> = ({ 
  children, 
  width = 'w-[40%]',
  enabled,
  type,
  title,
  active,
  loading,
  error
}) => {
  // Display error if present
  if (error) {
    return (
      <div className={`${width} rounded-md overflow-hidden border border-red-800 bg-black`}>
        <div className="w-full h-full flex items-center justify-center text-xs text-red-500">
          {error.message || "Error initializing visualizer"}
        </div>
      </div>
    );
  }

  // Display loading state
  if (loading) {
    return (
      <div className={`${width} rounded-md overflow-hidden border border-gray-800 bg-black`}>
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
          Loading {title || type}...
        </div>
      </div>
    );
  }

  return (
    <div className={`${width} rounded-md overflow-hidden border border-gray-800 bg-black`}>
      {enabled ? (
        <div className="h-full">
          {title && (
            <div className="px-2 py-1 text-xs text-gray-400 bg-gray-900 border-b border-gray-800">
              {title}
            </div>
          )}
          <div className={title ? "h-[calc(100%-24px)]" : "h-full"}>
            {children}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
          {title || type} disabled
        </div>
      )}
    </div>
  );
};

export default VisualizerPanel;
