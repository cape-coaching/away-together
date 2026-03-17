"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PreviewItem {
  id: string;
  locationName: string;
  dayNumber: number | null;
  photo: string | null;
  rating: number | null;
}

interface ItineraryListItem {
  id: string;
  title: string;
  description: string | null;
  destination: string;
  visibility: "draft" | "public";
  tags: string[];
  itemCount: number;
  previewItems: PreviewItem[];
  updatedAt: string;
}

export default function TripsClient({ userId }: { userId: string }) {
  const [itineraries, setItineraries] = useState<ItineraryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "public">("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("visibility", filter);
    fetch(`/api/itineraries?${params}`)
      .then((r) => r.json())
      .then((data) => setItineraries(data.items))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="pb-20 pt-2 bg-stone-50 min-h-full">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-[22px] font-bold text-stone-900 tracking-tight">Trips</h1>
        <p className="text-[13px] text-stone-400 mt-0.5">Your itineraries and city guides</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 pb-4">
        {(["all", "draft", "public"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip ${filter === f ? "chip-active" : "chip-inactive"}`}
          >
            {f === "all" ? "All" : f === "draft" ? "Drafts" : "Published"}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="px-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-2xl h-[140px]" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && itineraries.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-20 px-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8 2 4 6 4 10c0 5.25 7 11.5 7.68 12.07a.5.5 0 0 0 .64 0C13 21.5 20 15.25 20 10c0-4-4-8-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">No trips yet</h3>
          <p className="text-sm text-stone-400 leading-relaxed">
            Check in to places you love — high-rated spots automatically become city guides.
          </p>
        </div>
      )}

      {/* Itinerary cards */}
      {!loading && (
        <div className="px-4 space-y-3">
          {itineraries.map((it, i) => (
            <Link
              key={it.id}
              href={`/trips/${it.id}`}
              className="block animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <ItineraryCard itinerary={it} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ItineraryCard({ itinerary }: { itinerary: ItineraryListItem }) {
  const { title, destination, visibility, itemCount, previewItems, tags, updatedAt } = itinerary;

  const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const previewPhotos = previewItems.filter((p) => p.photo).slice(0, 3);

  return (
    <article className="card overflow-hidden card-hover">
      {/* Photo strip */}
      {previewPhotos.length > 0 && (
        <div className="flex h-[100px] overflow-hidden">
          {previewPhotos.map((p) => (
            <div key={p.id} className="flex-1 relative">
              <img
                src={p.photo!}
                alt={p.locationName}
                className="w-full h-full object-cover"
              />
              {p.rating && (
                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 glass-dark px-1.5 py-0.5 rounded-lg">
                  <span className="text-[10px] text-amber-400">★</span>
                  <span className="text-[10px] font-bold text-white">{p.rating}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-stone-900 truncate">{title}</h3>
            <p className="text-[12px] text-stone-400 mt-0.5">
              {destination} · {itemCount} {itemCount === 1 ? "place" : "places"} · {formattedDate}
            </p>
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
              visibility === "public"
                ? "score-high"
                : "score-low"
            }`}
          >
            {visibility === "public" ? "Published" : "Draft"}
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && tags[0] !== "auto" && (
          <div className="flex gap-1.5 mt-2.5">
            {tags.map((tag) => (
              <span key={tag} className="text-[11px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Preview names when no photos */}
        {previewPhotos.length === 0 && previewItems.length > 0 && (
          <div className="mt-2.5 space-y-1">
            {previewItems.map((item) => (
              <p key={item.id} className="text-[12px] text-stone-500 truncate flex items-center gap-1.5">
                <svg className="w-3 h-3 text-stone-300 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8 2 4 6 4 10c0 5.25 7 11.5 7.68 12.07a.5.5 0 0 0 .64 0C13 21.5 20 15.25 20 10c0-4-4-8-8-8z"/>
                </svg>
                {item.locationName}
              </p>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
