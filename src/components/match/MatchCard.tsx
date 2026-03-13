"use client";

import { useState } from "react";
import Link from "next/link";
import type { TravelerMatch } from "@/types";

interface MatchCardProps {
  match: TravelerMatch;
}

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "text-emerald-600 bg-emerald-50" :
  score >= 60 ? "text-sky-600 bg-sky-50" :
                "text-gray-600 bg-gray-100";

const BREAKDOWN_LABELS = {
  geo:         { label: "Destinations",  icon: "🌍" },
  taste:       { label: "Taste",         icon: "🍽️" },
  style:       { label: "Travel Style",  icon: "🎒" },
  engagement:  { label: "Engagement",    icon: "✍️" },
};

export function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { user, score, breakdown } = match;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-sky-100 overflow-hidden flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-sky-600">
              {user.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-400">@{user.username}</p>
          {user.bio && <p className="text-xs text-gray-500 mt-0.5 truncate">{user.bio}</p>}
        </div>

        {/* Score ring (simplified as badge) */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <div className={`px-2.5 py-1 rounded-full text-base font-bold ${SCORE_COLOR(score)}`}>
            {score}%
          </div>
          <span className="text-[10px] text-gray-400">match</span>
        </div>

        {/* Chevron */}
        <span className={`text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}>›</span>
      </button>

      {/* Expanded breakdown */}
      {expanded && breakdown && (
        <div className="px-4 pb-4 animate-fade-in-up">
          <div className="border-t border-gray-50 pt-3 grid grid-cols-2 gap-2">
            {(Object.entries(BREAKDOWN_LABELS) as [keyof typeof BREAKDOWN_LABELS, typeof BREAKDOWN_LABELS[keyof typeof BREAKDOWN_LABELS]][]).map(
              ([key, { label, icon }]) => {
                const val = breakdown[key];
                return (
                  <div key={key} className="bg-gray-50 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">{icon} {label}</span>
                      <span className="text-xs font-bold text-gray-800">{val}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full transition-all duration-500"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* CTA */}
          <Link
            href={`/profile/${user.username}`}
            className="mt-3 block w-full text-center py-2.5 rounded-2xl bg-sky-500 text-white text-sm font-semibold active:scale-95 transition-all"
          >
            View Profile
          </Link>
        </div>
      )}
    </div>
  );
}
