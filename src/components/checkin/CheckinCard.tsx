"use client";

import Link from "next/link";
import type { CheckinWithDetails } from "@/types";

interface CheckinCardProps {
  checkin: CheckinWithDetails;
  compact?: boolean;
}

const STAR_LABELS: Record<number, string> = {
  1: "😐", 2: "🙂", 3: "😊", 4: "😍", 5: "🤩",
};

export function CheckinCard({ checkin, compact = false }: CheckinCardProps) {
  const { user, location, rating, reviewText, photoUrls, visitedDate, occasionTag } = checkin;

  const formattedDate = new Date(visitedDate).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  if (compact) {
    return (
      <div className="flex gap-3 items-start bg-gray-50 rounded-2xl p-3">
        {photoUrls[0] ? (
          <img src={photoUrls[0]} alt={location.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-sky-100 flex items-center justify-center text-2xl flex-shrink-0">
            📍
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{location.name}</p>
          <p className="text-xs text-gray-500">{location.city} · {formattedDate}</p>
          <div className="flex items-center gap-1 mt-1">
            {"⭐".repeat(rating).split("").map((s, i) => (
              <span key={i} className="text-xs">{s}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="px-4 py-4 bg-white">
      {/* User header */}
      <div className="flex items-center gap-2.5 mb-3">
        <Link href={`/profile/${user.username}`}>
          <div className="w-9 h-9 rounded-full bg-sky-100 overflow-hidden flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-sky-600">
                {user.name[0]}
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${user.username}`}>
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
          </Link>
          <p className="text-xs text-gray-400">{formattedDate}</p>
        </div>
        {occasionTag && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{occasionTag}</span>
        )}
      </div>

      {/* Photos */}
      {photoUrls.length > 0 && (
        <div className={`mb-3 rounded-2xl overflow-hidden ${photoUrls.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}`}>
          {photoUrls.slice(0, 4).map((url, i) => (
            <div key={url} className={`relative ${photoUrls.length === 1 ? "aspect-[4/3]" : "aspect-square"}`}>
              <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              {i === 3 && photoUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{photoUrls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Place info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{location.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            📍 {location.neighborhood ? `${location.neighborhood}, ` : ""}{location.city}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
          <span className="text-sm">{STAR_LABELS[rating]}</span>
          <span className="text-sm font-bold text-amber-600">{rating}</span>
        </div>
      </div>

      {/* Review */}
      {reviewText && (
        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{reviewText}</p>
      )}
    </article>
  );
}
