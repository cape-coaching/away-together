"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CheckinCard } from "@/components/checkin/CheckinCard";
import type { CheckinWithDetails } from "@/types";

interface FeedClientProps {
  userId: string;
}

export default function FeedClient({ userId }: FeedClientProps) {
  const [items, setItems]         = useState<CheckinWithDetails[]>([]);
  const [cursor, setCursor]       = useState<string | null>(null);
  const [hasMore, setHasMore]     = useState(true);
  const [loading, setLoading]     = useState(false);
  const [view, setView]           = useState<"list" | "map">("list");
  const sentinelRef               = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);
      const res  = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  // Initial load
  useEffect(() => { loadMore(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Feed</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              {v === "list" ? "📋" : "🗺️"}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {view === "list" ? (
          <div className="divide-y divide-gray-50">
            {items.map((item, i) => (
              <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${(i % 10) * 40}ms` }}>
                <CheckinCard checkin={item} />
              </div>
            ))}
          </div>
        ) : (
          <MapPlaceholder />
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {loading && (
            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          )}
          {!hasMore && items.length > 0 && (
            <p className="text-xs text-gray-400">You're all caught up ✈️</p>
          )}
        </div>

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <span className="text-5xl mb-4">🌍</span>
            <h3 className="font-semibold text-gray-800 mb-1">No check-ins yet</h3>
            <p className="text-sm text-gray-500">
              Follow other travelers or log your first check-in to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-6 mt-8">
      <span className="text-5xl mb-3">🗺️</span>
      <p className="text-sm text-gray-500">Map view coming soon — requires Mapbox token in .env</p>
    </div>
  );
}
