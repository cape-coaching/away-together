"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/feed",    label: "Feed",    icon: "🏠" },
  { href: "/checkin", label: "Log",     icon: "➕" },
  { href: "/match",   label: "Match",   icon: "🤝" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

export function BottomNav({ username }: { username?: string }) {
  const pathname = usePathname();

  const hrefFor = (tab: typeof TABS[number]) =>
    tab.href === "/profile" && username ? `/profile/${username}` : tab.href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center max-w-app mx-auto">
        {TABS.map((tab) => {
          const href    = hrefFor(tab);
          const active  = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={href}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-opacity active:opacity-60"
            >
              <span className={`text-xl transition-transform ${active ? "scale-110" : "scale-100 opacity-50"}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-medium ${active ? "text-sky-600" : "text-gray-400"}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-sky-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
