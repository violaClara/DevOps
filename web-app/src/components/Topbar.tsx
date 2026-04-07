"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Topbar() {
  const { lang, setLang } = useLanguage();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 shrink-0 sticky top-0 z-40 w-full overflow-hidden shadow-sm">
      <div className="text-lg font-bold tracking-widest text-slate-800 flex items-center md:mr-8 gap-1">
          INDO<span className="text-red-700">ARSIP</span>
      </div>
      
       <div className="flex-1"></div>

       <div className="ml-auto flex items-center gap-2">
          <button 
             onClick={() => setLang('id')}
             className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${lang === 'id' ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
          >
             ID
          </button>
          <button 
             onClick={() => setLang('en')}
             className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${lang === 'en' ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
          >
             EN
          </button>
       </div>
    </header>
  );
}
