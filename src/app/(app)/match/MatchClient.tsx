"use client";

import { useEffect, useState } from "react";
import { MatchCard } from "@/components/match/MatchCard";
import type { TravelerMatch } from "@/types";

const FILTERS = ["All", "High Match", "Same Cities", "Same Style"];

export default function MatchClient() {
  const [matches, setMatches]       = useState<TravelerMatch[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const load = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const res  = await fetch(`/api/match?limit=20${force ? "&forceRefresh=true" : ""}`);
      const data = await res.json();
      setMatches(data.items ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visible = matches.filter((m) => {
    if (filter === "High Match") return m.score >= 70;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-stone-200/50 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-stone-900">Matches</h1>
            <p className="text-[13px] text-stone-400 mt-0.5">Based on your travel history</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-[13px] text-rose-500 font-semibold disabled:opacity-40 active:opacity-60 transition-opacity"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip flex-shrink-0 ${filter === f ? "chip-active" : "chip-inactive"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-5 pt-4 space-y-3">
        {loading ? (
          <>
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton rounded-2xl h-24" />
            ))}
          </>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3 className="font-semibold text-stone-800 mb-1">No matches yet</h3>
            <p className="text-[13px] text-stone-400 max-w-[240px] leading-relaxed">
              Log more check-ins so the algorithm can find your travel twin.
            </p>
          </div>
        ) : (
          visible.map((match, i) => (
            <div key={match.user.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <MatchCard match={match} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
