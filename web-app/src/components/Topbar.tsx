export function Topbar() {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 shrink-0 sticky top-0 z-40 w-full overflow-hidden shadow-sm">
      <div className="text-lg font-bold tracking-widest text-slate-800 flex items-center md:mr-8 gap-1">
          INDO<span className="text-red-700">ARSIP</span>
      </div>
      
       <nav className="hidden md:flex gap-1 text-sm font-medium text-slate-600 h-full items-center flex-1 overflow-x-auto whitespace-nowrap hide-scrollbar ml-4">
         <span className="text-red-800 bg-red-50/80 px-4 py-1.5 rounded h-9 flex items-center relative after:content-[''] after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-[3px] after:bg-red-700 after:rounded-t-md">
            Dashboard
         </span>
         <span className="px-4 py-1.5 h-9 flex items-center hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer transition-colors">
            OCR Projects
         </span>
         <span className="px-4 py-1.5 h-9 flex items-center hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer transition-colors">
            History
         </span>
         <span className="px-4 py-1.5 h-9 flex items-center hover:text-slate-900 hover:bg-slate-50 rounded cursor-pointer transition-colors">
            Team
         </span>
       </nav>

       <div className="ml-auto hidden md:flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
              AD
          </div>
       </div>
    </header>
  );
}
