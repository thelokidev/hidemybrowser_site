import React from 'react';
import InvisibilityAnimation from './components/InvisibilityAnimation';
import WorkflowAnimation from './components/WorkflowAnimation';
import { CheckIcon } from './components/Icons';

const App: React.FC = () => {
  return (
    <div className="bg-black min-h-screen text-slate-300 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="space-y-24 md:space-y-32">

          {/* Feature 1: Invisible to screen-share */}
          <section className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="md:order-2 flex items-center justify-center h-80 md:h-96">
              <InvisibilityAnimation />
            </div>
            <div className="md:order-1">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Invisible to screen-share
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Never shows up in shared screens, recordings, or internal meeting tools. It's fully hidden from everyone but you.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start">
                  <CheckIcon className="w-6 h-6 text-gray-400 flex-shrink-0 mr-3 mt-1" />
                  <span>System-level invisibility layer</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-6 h-6 text-gray-400 flex-shrink-0 mr-3 mt-1" />
                  <span>Undetectable by recording software</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-6 h-6 text-gray-400 flex-shrink-0 mr-3 mt-1" />
                  <span>No traces in system logs</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Feature 2: Follow your workflow */}
          <section className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="flex items-center justify-center h-80 md:h-96">
              <WorkflowAnimation />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Follow your workflow
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                The window is fully movable so you can position it exactly where you need it — without ever breaking concentration.
              </p>
              <div className="mt-6">
                <p className="font-semibold text-slate-200">Keyboard shortcuts</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-slate-800 text-slate-300 text-sm font-mono py-1 px-3 rounded-md border border-slate-700">Toggle (Alt+\)</span>
                  <span className="bg-slate-800 text-slate-300 text-sm font-mono py-1 px-3 rounded-md border border-slate-700">Snap/Drag</span>
                  <span className="bg-slate-800 text-slate-300 text-sm font-mono py-1 px-3 rounded-md border border-slate-700">Opacity</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default App;