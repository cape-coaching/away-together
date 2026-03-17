"use client";

import { useState } from "react";
import Link from "next/link";
import type { TravelerMatch } from "@/types";

const SCORE_STYLE = (score: number) =>
  score >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
  score >= 60 ? "text-sky-600 bg-sky-50 border-sky-100" :
                "text-gray-600 bg-gray-50 border-gray-100";

const BREAKDOWN_LABELS = {
  geo:        { label: "Destinations", icon: "🌍" },
  taste:      { label: "Taste",        icon: "🍽️" },
  style:      { label: "Style",        icon: "🎒" },
  engagement: { label: "Engagement",   icon: "✍️" },
};

export function MatchCard({ match }: { match: TravelerMatch }) {
  const [expanded, setExpanded] = useState(false);
  const { user, score, breakdown } = match;

  return (
    <div className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden transition-shadow duration-200 hover:shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3.5 p-4 text-left active:bg-gray-50/50 transition-colors duration-150"
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 overflow-hidden flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-sky-600">
              {user.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-gray-900">{user.name}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">@{user.username}</p>
          {user.bio && <p className="text-[12px] text-gray-500 mt-1 line-clamp-1">{user.bio}</p>}
        </div>

        {/* Score */}
        <div className={`px-3 py-1.5 rounded-xl text-[15px] font-bold border ${SCORE_STYLE(score)}`}>
          {score}%
        </div>
      </button>

      {/* Expanded */}
      {expanded && breakdown && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="border-t border-gray-50 pt-3 grid grid-cols-2 gap-2">
            {(Object.entries(BREAKDOWN_LABELS) as [keyof typeof BREAKDOWN_LABELS, typeof BREAKDOWN_LABELS[keyof typeof BREAKDOWN_LABELS]][]).map(
              ([key, { label, icon }]) => {
                const val = breakdown[key];
                return (
                  <div key={key} className="bg-gray-50/70 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-gray-400">{icon} {label}</span>
                      <span className="text-[11px] font-semibold text-gray-700">{val}%</span>
                    </div>
                    <div className="h-1 bg-gray-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <Link
            href={`/profile/${user.username}`}
            className="mt-3 block w-full text-center py-3 rounded-xl bg-gray-900 text-white text-[14px] font-medium active:scale-[0.98] transition-all duration-200"
          >
            View Profile
          </Link>
        </div>
      )}
    </div>
  );
}
