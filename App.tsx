import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TransformerScene } from './components/TransformerScene';
import { InfoPanel } from './components/InfoPanel';
import { TransformerBlockData } from './types';

const App: React.FC = () => {
  const [selectedBlock, setSelectedBlock] = useState<TransformerBlockData | null>(null);

  const handleBlockSelect = (block: TransformerBlockData) => {
    setSelectedBlock(block);
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      {/* 3D Canvas Container */}
      <div className="absolute inset-0 z-0">
        <TransformerScene 
            onBlockSelect={handleBlockSelect} 
            selectedBlockId={selectedBlock?.id || null} 
        />
      </div>

      {/* UI Overlay */}
      <InfoPanel 
        selectedBlock={selectedBlock} 
        onClose={() => setSelectedBlock(null)} 
      />

      {/* Footer/Credits */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-slate-500 pointer-events-none">
        <p>由 Google Gemini 2.5 Flash & React Three Fiber 驱动</p>
      </div>
    </div>
  );
};

export default App;