"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, Archive } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/", icon: Home, label: t("nav_home") },
    { href: "/documents", icon: FolderOpen, label: t("nav_documents") },
    { href: "/archive", icon: Archive, label: t("nav_archive") },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-20 bg-white border-r border-slate-200 flex-col items-center py-4 shrink-0 h-screen sticky top-0 shadow-sm z-50">
        <div className="text-red-700 font-extrabold text-2xl mb-8 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0ZM35.4371 67.5L50 42.5L64.5629 67.5H35.4371Z" fill="#b91c1c"/>
          </svg>
        </div>
        
        <nav className="flex flex-col gap-2 w-full">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 w-full py-3 transition-colors ${active ? 'bg-red-50 text-red-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'} relative group`}>
                {active && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700 rounded-r-md"></div>
                )}
                <div className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <item.icon size={22} strokeWidth={active ? 2 : 1.5} />
                </div>
                <span className="text-[10px] font-medium tracking-wide mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-full h-full gap-1 relative ${active ? 'text-red-700' : 'text-slate-500 hover:text-slate-900'}`}>
              {active && (
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-700 rounded-b-md"></div>
              )}
              <item.icon size={20} strokeWidth={active ? 2 : 1.5} className="mt-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
