"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/feed",    label: "Feed",    iconActive: "🏠", iconInactive: "🏠" },
  { href: "/checkin", label: "Log",     iconActive: "➕", iconInactive: "➕" },
  { href: "/trips",   label: "Trips",   iconActive: "🗺️", iconInactive: "🗺️" },
  { href: "/match",   label: "Match",   iconActive: "🤝", iconInactive: "🤝" },
  { href: "/profile", label: "Profile", iconActive: "👤", iconInactive: "👤" },
] as const;

export function BottomNav({ username }: { username?: string }) {
  const pathname = usePathname();

  const hrefFor = (tab: typeof TABS[number]) =>
    tab.href === "/profile" && username ? `/profile/${username}` : tab.href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 glass border-t border-white/40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center max-w-app mx-auto h-14">
        {TABS.map((tab) => {
          const href   = hrefFor(tab);
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 active:opacity-60 transition-opacity duration-150"
            >
              <span className={`text-lg transition-all duration-200 ${active ? "scale-105" : "scale-100 grayscale opacity-40"}`}>
                {active ? tab.iconActive : tab.iconInactive}
              </span>
              <span className={`text-[10px] tracking-wide transition-colors duration-200 ${active ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
