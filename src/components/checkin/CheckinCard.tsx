"use client";

import Link from "next/link";
import type { CheckinWithDetails } from "@/types";

interface CheckinCardProps {
  checkin: CheckinWithDetails;
  compact?: boolean;
}

export function CheckinCard({ checkin, compact = false }: CheckinCardProps) {
  const { user, location, rating, reviewText, photoUrls, visitedDate, occasionTag } = checkin;

  const formattedDate = new Date(visitedDate).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  if (compact) {
    return (
      <div className="flex gap-3.5 items-start bg-gray-50/70 rounded-xl p-3.5">
        {photoUrls[0] ? (
          <img src={photoUrls[0]} alt={location.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg text-gray-300">📍</span>
          </div>
        )}
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-[14px] font-semibold text-gray-900 truncate">{location.name}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{location.city} · {formattedDate}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[11px] text-amber-500">{"★".repeat(Math.round(rating))}</span>
            <span className="text-[11px] font-semibold text-gray-500">{rating}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full card — used in non-feed contexts
  return (
    <article className="mx-4 my-3 bg-white rounded-2xl border border-gray-100/80 overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/profile/${user.username}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 overflow-hidden flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-sky-600">
                {user.name[0]}
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${user.username}`}>
            <p className="text-[13px] font-semibold text-gray-900">{user.name}</p>
          </Link>
          <p className="text-[11px] text-gray-400">{formattedDate}</p>
        </div>
        {occasionTag && (
          <span className="text-[11px] bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full font-medium">{occasionTag}</span>
        )}
      </div>

      {photoUrls.length > 0 && (
        <div className="aspect-[4/3]">
          <img src={photoUrls[0]} alt={location.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 pt-3 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-gray-900 truncate">{location.name}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {location.neighborhood ? `${location.neighborhood}, ` : ""}{location.city}, {location.country}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100">
            <span className="text-[12px]">★</span>
            <span className="text-[13px] font-bold text-amber-600">{rating}</span>
          </div>
        </div>

        {reviewText && (
          <p className="text-[14px] text-gray-600 mt-3 leading-relaxed">{reviewText}</p>
        )}
      </div>
    </article>
  );
}
