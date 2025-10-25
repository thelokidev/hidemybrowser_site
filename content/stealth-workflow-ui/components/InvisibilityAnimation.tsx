import React from 'react';
import { EyeIcon, ScreenShareIcon, CodeIcon, ChartIcon, MailIcon } from './Icons';

const Window: React.FC<{ icon: React.ReactNode; title: string; color: string; className?: string }> = ({ icon, title, color, className = '' }) => (
  <div className={`absolute w-32 h-24 rounded-lg shadow-lg border ${className}`} style={{borderColor: color}}>
    <div className={`h-6 rounded-t-md flex items-center px-2`} style={{backgroundColor: color}}>
      {icon}
      <span className="text-xs font-bold text-black ml-1 truncate">{title}</span>
    </div>
    <div className="bg-slate-800/80 backdrop-blur-sm h-[calc(6rem-1.5rem)] rounded-b-lg p-2">
      <div className="w-full h-1 bg-slate-700 rounded-full mb-2"></div>
      <div className="w-3/4 h-1 bg-slate-700 rounded-full mb-2"></div>
      <div className="w-1/2 h-1 bg-slate-700 rounded-full"></div>
    </div>
  </div>
);

const SecretWindow: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`absolute w-36 h-28 rounded-lg shadow-2xl border-2 border-cyan-400 ${className}`}>
        <div className="h-7 bg-cyan-400 rounded-t-md flex items-center px-2">
            <CodeIcon className="w-4 h-4 text-black" />
            <span className="text-sm font-bold text-black ml-2">SecretApp.tsx</span>
        </div>
        <div className="bg-slate-900/70 backdrop-blur-sm h-[calc(7rem-1.75rem)] rounded-b-lg p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-cyan-500/10 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
            <span className="font-mono text-xs text-cyan-300">const stealth = true;</span>
        </div>
    </div>
);


const InvisibilityAnimation: React.FC = () => {
  return (
    <div style={{ perspective: '1000px' }} className="w-full h-full flex items-center justify-center">
      <div className="relative w-80 h-64 animation-subtle-rotate" style={{ transformStyle: 'preserve-3d' }}>
        {/* Layer 1: User's Actual View (Bottom) */}
        <div className="absolute inset-0" style={{ transform: 'translateZ(-50px)' }}>
          <div className="absolute inset-0 bg-slate-800/50 rounded-2xl border border-slate-700 shadow-2xl"></div>
          <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-300">
            <EyeIcon className="w-5 h-5"/>
            <span className="font-semibold">Your View</span>
          </div>
          <Window icon={<ChartIcon className="w-4 h-4 text-black"/>} title="Analytics" color="#f59e0b" className="top-12 left-8"/>
          <Window icon={<MailIcon className="w-4 h-4 text-black"/>} title="Inbox" color="#84cc16" className="top-1/2 left-1/4 -translate-y-1/2"/>
          <SecretWindow className="bottom-4 right-4"/>
        </div>

        {/* Layer 2: Screen Share View (Top) */}
        <div className="absolute inset-0" style={{ transform: 'translateZ(50px)' }}>
          <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-sm rounded-2xl border border-indigo-700 shadow-2xl"></div>
          <div className="absolute top-4 left-4 flex items-center gap-2 text-indigo-300">
            <ScreenShareIcon className="w-5 h-5"/>
            <span className="font-semibold">Screen Share View</span>
          </div>
          <Window icon={<ChartIcon className="w-4 h-4 text-black"/>} title="Analytics" color="#f59e0b" className="top-12 left-8"/>
          <Window icon={<MailIcon className="w-4 h-4 text-black"/>} title="Inbox" color="#84cc16" className="top-1/2 left-1/4 -translate-y-1/2"/>
          {/* The SecretWindow is intentionally missing here */}
        </div>
      </div>
    </div>
  );
};

export default InvisibilityAnimation;