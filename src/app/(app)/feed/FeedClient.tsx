"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { CheckinWithDetails } from "@/types";

interface FeedClientProps {
  userId: string;
}

export default function FeedClient({ userId }: FeedClientProps) {
  const [items, setItems]     = useState<CheckinWithDetails[]>([]);
  const [cursor, setCursor]   = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const containerRef          = useRef<HTMLDivElement>(null);

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

  useEffect(() => { loadMore(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setCurrent(idx);
      if (idx >= items.length - 3 && hasMore) loadMore();
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [items.length, hasMore, loadMore]);

  return (
    <div className="h-screen w-full bg-black">
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {items.map((item, i) => (
          <FeedCard key={item.id} checkin={item} />
        ))}

        {loading && items.length === 0 && (
          <div className="h-full flex items-center justify-center snap-start">
            <div className="w-6 h-6 border-2 border-white/60 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center snap-start text-center px-10">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
              <span className="text-3xl">🌍</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No check-ins yet</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Follow other travelers or log your first check-in to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Photo Carousel ─────────────────────────────────────────── */

function PhotoCarousel({ photos, locationName }: { photos: string[]; locationName: string }) {
  const [idx, setIdx] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiping = useRef(false);

  const goTo = (i: number) => setIdx(Math.max(0, Math.min(photos.length - 1, i)));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    swiping.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiping.current = true;
      e.stopPropagation();
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || !swiping.current) { touchStart.current = null; return; }
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (dx < -40) goTo(idx + 1);
    else if (dx > 40) goTo(idx - 1);
    touchStart.current = null;
    swiping.current = false;
  };

  if (photos.length === 0) {
    return <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-600" />;
  }

  return (
    <>
      <div
        className="absolute inset-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {photos.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`${locationName} photo ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out"
            style={{ opacity: i === idx ? 1 : 0 }}
          />
        ))}
      </div>
      {photos.length > 1 && (
        <div className="absolute top-[60px] left-0 right-0 flex justify-center gap-2 z-10">
          {photos.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-6 h-[3px] bg-white"
                  : "w-[3px] h-[3px] bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ── Feed Card ──────────────────────────────────────────────── */

function FeedCard({ checkin }: { checkin: CheckinWithDetails }) {
  const { user, location, rating, reviewText, photoUrls, visitedDate, occasionTag } = checkin;

  const formattedDate = new Date(visitedDate).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  return (
    <div className="h-full w-full snap-start relative flex-shrink-0 overflow-hidden">
      <PhotoCarousel photos={photoUrls} locationName={location.name} />

      {/* Top gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-40% to-black/70 pointer-events-none" />

      {/* User info — top */}
      <div className="absolute top-0 left-0 right-0 pt-4 px-5 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${user.username}`}>
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30 flex-shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center text-xs font-semibold text-white">
                  {user.name[0]}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.username}`}>
              <p className="text-[13px] font-semibold text-white">{user.name}</p>
            </Link>
            <p className="text-[11px] text-white/50">{formattedDate}</p>
          </div>
          {occasionTag && (
            <span className="text-[11px] glass-dark text-white/90 px-3 py-1 rounded-full font-medium">
              {occasionTag}
            </span>
          )}
        </div>
      </div>

      {/* Location + Review — bottom */}
      <div className="absolute bottom-0 left-0 right-0 pb-[88px] px-5 z-10">
        {/* Rating */}
        <div className="inline-flex items-center gap-1.5 glass-dark px-3 py-1.5 rounded-full mb-3">
          <span className="text-sm">{"★".repeat(Math.round(rating))}</span>
          <span className="text-[13px] font-semibold text-white">{rating}</span>
        </div>

        {/* Location */}
        <h2 className="text-[22px] font-semibold text-white leading-tight tracking-tight">
          {location.name}
        </h2>
        <p className="text-[13px] text-white/60 mt-1 font-light">
          {location.neighborhood ? `${location.neighborhood}, ` : ""}{location.city}, {location.country}
        </p>

        {/* Review */}
        {reviewText && (
          <p className="text-[14px] text-white/80 mt-3 leading-[1.6] font-light line-clamp-3">
            &ldquo;{reviewText}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
