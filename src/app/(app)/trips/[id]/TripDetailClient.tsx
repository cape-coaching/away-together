"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ItemCheckin {
  id: string;
  rating: number;
  reviewText: string | null;
  occasionTag: string | null;
  visitedDate: string;
  photoUrls: string[];
  location: {
    id: string;
    name: string;
    city: string;
    country: string;
    neighborhood: string | null;
    placeType: string;
  };
}

interface ItineraryItem {
  id: string;
  locationName: string;
  notes: string | null;
  dayNumber: number | null;
  orderIndex: number;
  checkin: ItemCheckin | null;
}

interface ItineraryDetail {
  id: string;
  title: string;
  description: string | null;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  visibility: "draft" | "public";
  tags: string[];
  forkedFromId: string | null;
  forkCount: number;
  user: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  items: ItineraryItem[];
  updatedAt: string;
}

export default function TripDetailClient({
  itineraryId,
  userId,
}: {
  itineraryId: string;
  userId: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<ItineraryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch(`/api/itineraries/${itineraryId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setData)
      .catch(() => router.push("/trips"))
      .finally(() => setLoading(false));
  }, [itineraryId, router]);

  const isOwner = data?.user.id === userId;

  const toggleVisibility = async () => {
    if (!data || !isOwner || toggling) return;
    setToggling(true);
    const newVis = data.visibility === "draft" ? "public" : "draft";
    const res = await fetch(`/api/itineraries/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: newVis }),
    });
    if (res.ok) {
      setData({ ...data, visibility: newVis });
    }
    setToggling(false);
  };

  if (loading) {
    return (
      <div className="pb-20 pt-2 px-5 bg-stone-50">
        <div className="skeleton rounded-xl h-8 w-48 mt-6 mb-3" />
        <div className="skeleton rounded-xl h-4 w-32 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton rounded-2xl h-[100px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Group items by dayNumber
  const grouped = new Map<number | null, ItineraryItem[]>();
  for (const item of data.items) {
    const key = item.dayNumber;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }
  const dayKeys = [...grouped.keys()].sort((a, b) => (a ?? 999) - (b ?? 999));

  return (
    <div className="pb-20 pt-2 bg-stone-50 min-h-full">
      {/* Back + Header */}
      <div className="px-5 pt-4 pb-1">
        <button
          onClick={() => router.push("/trips")}
          className="text-[13px] text-stone-400 mb-4 flex items-center gap-1.5 active:opacity-60 font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Trips
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-bold text-stone-900 tracking-tight leading-tight">
              {data.title}
            </h1>
            <p className="text-[13px] text-stone-400 mt-1">
              {data.destination} · {data.items.length}{" "}
              {data.items.length === 1 ? "place" : "places"}
            </p>
          </div>
          {isOwner && (
            <button
              onClick={toggleVisibility}
              disabled={toggling}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all duration-200 flex-shrink-0 ${
                data.visibility === "public"
                  ? "score-high"
                  : "score-low"
              } ${toggling ? "opacity-50" : "active:scale-95"}`}
            >
              {data.visibility === "public" ? "Published" : "Draft"}
            </button>
          )}
        </div>

        {data.description && (
          <p className="text-[14px] text-stone-500 mt-3 leading-relaxed">
            {data.description}
          </p>
        )}

        {/* Author (if not own) */}
        {!isOwner && (
          <Link
            href={`/profile/${data.user.username}`}
            className="flex items-center gap-2.5 mt-4 py-2"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-amber-50 overflow-hidden flex-shrink-0">
              {data.user.avatarUrl ? (
                <img
                  src={data.user.avatarUrl}
                  alt={data.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-rose-400">
                  {data.user.name[0]}
                </div>
              )}
            </div>
            <span className="text-[13px] text-stone-500">
              by <span className="font-semibold text-stone-700">{data.user.name}</span>
            </span>
          </Link>
        )}
      </div>

      {/* Items */}
      <div className="px-4 mt-5">
        {dayKeys.map((dayNum) => (
          <div key={dayNum ?? "none"} className="mb-5">
            {dayNum !== null && (
              <p className="section-label px-1 mb-2.5">
                Day {dayNum}
              </p>
            )}
            <div className="space-y-2.5">
              {grouped.get(dayNum)!.map((item, i) => (
                <ItemCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fork count */}
      {data.forkCount > 0 && (
        <div className="px-5 mt-4">
          <p className="text-[12px] text-stone-400">
            Forked {data.forkCount} {data.forkCount === 1 ? "time" : "times"}
          </p>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, index }: { item: ItineraryItem; index: number }) {
  const { checkin } = item;
  const photo = checkin?.photoUrls?.[0];

  return (
    <div
      className="flex gap-3.5 card p-3.5 animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Number badge */}
      <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-rose-200">
        <span className="text-[11px] font-bold text-white">{index + 1}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-stone-900 truncate">
          {item.locationName}
        </p>
        {checkin?.location && (
          <p className="text-[12px] text-stone-400 mt-0.5">
            {checkin.location.neighborhood
              ? `${checkin.location.neighborhood}, `
              : ""}
            {checkin.location.city}
          </p>
        )}
        {checkin && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-0.5">
              <span className="text-[11px] text-amber-500">
                {"★".repeat(Math.round(checkin.rating))}
              </span>
              <span className="text-[11px] font-bold text-stone-500">
                {checkin.rating}
              </span>
            </div>
            {checkin.occasionTag && (
              <span className="text-[11px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                {checkin.occasionTag}
              </span>
            )}
          </div>
        )}
        {checkin?.reviewText && (
          <p className="text-[12px] text-stone-500 mt-2 leading-relaxed line-clamp-2">
            {checkin.reviewText}
          </p>
        )}
        {item.notes && (
          <p className="text-[12px] text-stone-400 mt-1.5 italic">{item.notes}</p>
        )}
      </div>

      {/* Photo */}
      {photo && (
        <img
          src={photo}
          alt={item.locationName}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
        />
      )}
    </div>
  );
}
