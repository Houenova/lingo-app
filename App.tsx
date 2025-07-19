
import React, { useState } from 'react';
import VocabularyPage from './pages/VocabularyPage';
import StructuresPage from './pages/StructuresPage';
import { AppView } from './types';

// SVG Icon components defined within App.tsx to reduce file count
const AcademicCapIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 011.07 0l3.25 1.711 3.25-1.711a.999.999 0 011.07 0L19 6.92a1 1 0 000-1.84l-7-3zM4.25 9.051L10 12v3.561l-5.75-3.026v-3.56zM15.75 9.051v3.56l-5.75 3.027V12l5.75-3.05z" />
  </svg>
);

const StructureIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M15 4H5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2zM5 6h10v2H5V6zm0 4h10v2H5v-2zm0 4h5v2H5v-2z" clipRule="evenodd" />
    </svg>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.VOCABULARY);

  const navItemClasses = "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors";
  const activeClasses = "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300";
  const inactiveClasses = "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700";

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-200">
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="h-7 w-7 text-sky-500" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">LingoLeap</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setView(AppView.VOCABULARY)}
              className={`${navItemClasses} ${view === AppView.VOCABULARY ? activeClasses : inactiveClasses}`}
            >
              <AcademicCapIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Vocabulary</span>
            </button>
            <button
              onClick={() => setView(AppView.STRUCTURES)}
              className={`${navItemClasses} ${view === AppView.STRUCTURES ? activeClasses : inactiveClasses}`}
            >
              <StructureIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Structures</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {view === AppView.VOCABULARY && <VocabularyPage />}
        {view === AppView.STRUCTURES && <StructuresPage />}
      </main>

       <footer className="text-center py-4 mt-8 text-xs text-slate-500 dark:text-slate-400">
        <p>Powered by React, Tailwind CSS, and Google Gemini. Happy learning!</p>
      </footer>
    </div>
  );
}
