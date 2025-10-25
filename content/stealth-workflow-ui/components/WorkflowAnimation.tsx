
import React, { useState, useEffect } from 'react';
import { CodeIcon, CursorIcon } from './Icons';

const WorkflowAnimation: React.FC = () => {
  const [activeShortcut, setActiveShortcut] = useState('Drag');

  useEffect(() => {
    const sequence = ['Snap', 'Opacity', 'Drag', 'Drag'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % sequence.length;
      setActiveShortcut(sequence[currentIndex]);
    }, 2500); // 10s animation / 4 steps

    return () => clearInterval(interval);
  }, []);

  const ShortcutIndicator: React.FC<{ name: string }> = ({ name }) => (
    <div className={`transition-all duration-300 text-xs font-mono py-1 px-3 rounded-md border ${
      activeShortcut === name 
        ? 'bg-cyan-400/20 border-cyan-400 text-cyan-300' 
        : 'bg-slate-800 border-slate-700 text-slate-400'
    }`}>
      {name}
    </div>
  );

  return (
    <div className="w-full max-w-sm h-full flex flex-col items-center justify-center">
      <div className="w-full h-64 bg-slate-800/50 rounded-xl border border-slate-700 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-grid-slate-700/20 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        
        {/* Animated Cursor */}
        <CursorIcon className="w-6 h-6 text-white absolute transform -translate-x-1/2 -translate-y-1/2 animation-workflow-cursor" />

        {/* Animated Window */}
        <div className="absolute w-40 h-24 rounded-lg shadow-2xl border-2 border-cyan-500 animation-workflow-window">
          <div className="h-6 bg-cyan-500 rounded-t-md flex items-center px-2">
            <CodeIcon className="w-4 h-4 text-black" />
          </div>
          <div className="bg-slate-900/80 backdrop-blur-sm h-[calc(6rem-1.5rem)] rounded-b-lg"></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <ShortcutIndicator name="Drag" />
        <ShortcutIndicator name="Snap" />
        <ShortcutIndicator name="Opacity" />
      </div>
    </div>
  );
};

export default WorkflowAnimation;
