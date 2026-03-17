"use client";

import { useSession } from "next-auth/react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const username = session?.user?.username ?? undefined;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <main className="flex-1 max-w-app mx-auto w-full relative">
        {children}
      </main>
      <BottomNav username={username} />
    </div>
  );
}
