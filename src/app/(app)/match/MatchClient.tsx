"use client";

import { useEffect, useState } from "react";
import { MatchCard } from "@/components/match/MatchCard";
import type { TravelerMatch } from "@/types";

const FILTER_OPTIONS = ["All", "High Match", "Same Cities", "Same Style"];

export default function MatchClient() {
  const [matches, setMatches]   = useState<TravelerMatch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("All");
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Traveler Match</h1>
            <p className="text-xs text-gray-400 mt-0.5">Based on your travel history</p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-sky-500 text-sm font-medium disabled:opacity-40"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === f
                  ? "bg-sky-500 text-white border-sky-500"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 py-4 space-y-3">
        {loading ? (
          <MatchSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState />
        ) : (
          visible.map((match, i) => (
            <div key={match.userId} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <MatchCard match={match} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MatchSkeleton() {
  return (
    <>
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-gray-100 rounded-3xl h-32 animate-pulse" />
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <span className="text-5xl mb-4">🤝</span>
      <h3 className="font-semibold text-gray-800 mb-1">No matches yet</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        Log more check-ins so the algorithm can find your travel twin.
      </p>
    </div>
  );
}
