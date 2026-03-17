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

  const filtered = itineraries;

  return (
    <div className="pb-20 pt-2">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Trips</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Your itineraries and city guides</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 pb-4">
        {(["all", "draft", "public"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[12px] font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 ${
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500 active:bg-gray-200"
            }`}
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
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-20 px-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
            <span className="text-3xl">🗺️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Check in to places you love — high-rated spots automatically become city guides.
          </p>
        </div>
      )}

      {/* Itinerary cards */}
      {!loading && (
        <div className="px-4 space-y-3">
          {filtered.map((it, i) => (
            <Link
              key={it.id}
              href={`/trips/${it.id}`}
              className={`block animate-fade-in-up ${i > 0 ? `delay-${Math.min(i * 50, 300)}` : ""}`}
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
    <article className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden active:scale-[0.98] transition-transform duration-150">
      {/* Photo strip */}
      {previewPhotos.length > 0 && (
        <div className="flex h-[100px] overflow-hidden">
          {previewPhotos.map((p, i) => (
            <div key={p.id} className="flex-1 relative">
              <img
                src={p.photo!}
                alt={p.locationName}
                className="w-full h-full object-cover"
              />
              {p.rating && (
                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                  <span className="text-[10px]">★</span>
                  <span className="text-[10px] font-semibold text-white">{p.rating}</span>
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
            <h3 className="text-[15px] font-semibold text-gray-900 truncate">{title}</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {destination} · {itemCount} {itemCount === 1 ? "place" : "places"} · {formattedDate}
            </p>
          </div>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
              visibility === "public"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-gray-50 text-gray-400 border border-gray-100"
            }`}
          >
            {visibility === "public" ? "Published" : "Draft"}
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && tags[0] !== "auto" && (
          <div className="flex gap-1.5 mt-2.5">
            {tags.map((tag) => (
              <span key={tag} className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Preview names */}
        {previewPhotos.length === 0 && previewItems.length > 0 && (
          <div className="mt-2.5 space-y-1">
            {previewItems.map((item) => (
              <p key={item.id} className="text-[12px] text-gray-500 truncate">
                📍 {item.locationName}
              </p>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
