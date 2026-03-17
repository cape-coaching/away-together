"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/feed",
    label: "Feed",
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.5"}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        {!active && <path d="M9 21V13h6v8"/>}
      </svg>
    ),
  },
  {
    href: "/checkin",
    label: "Log",
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "1.5"} strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
  },
  {
    href: "/trips",
    label: "Trips",
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8 2 4 6 4 10c0 5.25 7 11.5 7.68 12.07a.5.5 0 0 0 .64 0C13 21.5 20 15.25 20 10c0-4-4-8-8-8z"/>
        {!active && <circle cx="12" cy="10" r="3"/>}
      </svg>
    ),
  },
  {
    href: "/match",
    label: "Match",
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.5"} strokeLinecap="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.5"} strokeLinecap="round">
        <circle cx="12" cy="8" r="5"/>
        <path d="M20 21a8 8 0 1 0-16 0"/>
      </svg>
    ),
  },
] as const;

export function BottomNav({ username }: { username?: string }) {
  const pathname = usePathname();

  const hrefFor = (tab: typeof TABS[number]) =>
    tab.href === "/profile" && username ? `/profile/${username}` : tab.href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-stone-950 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center max-w-app mx-auto h-[58px]">
        {TABS.map((tab) => {
          const href   = hrefFor(tab);
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 active:opacity-60 transition-all duration-150"
            >
              <span className={`transition-colors duration-200 ${active ? "text-white" : "text-stone-500"}`}>
                {tab.icon(active)}
              </span>
              <span className={`text-[10px] tracking-wide transition-colors duration-200 ${active ? "text-white font-semibold" : "text-stone-500"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
