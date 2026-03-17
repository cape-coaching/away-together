"use client";

import { useState } from "react";
import Link from "next/link";
import type { TravelerMatch } from "@/types";

const SCORE_STYLE = (score: number) =>
  score >= 80 ? "score-high" :
  score >= 60 ? "score-medium" :
                "score-low";

const BREAKDOWN_LABELS = {
  geo:        { label: "Destinations", color: "from-emerald-400 to-emerald-500" },
  taste:      { label: "Taste",        color: "from-amber-400 to-amber-500" },
  style:      { label: "Travel Style", color: "from-sky-400 to-sky-500" },
  engagement: { label: "Engagement",   color: "from-violet-400 to-violet-500" },
};

export function MatchCard({ match }: { match: TravelerMatch }) {
  const [expanded, setExpanded] = useState(false);
  const { user, score, breakdown } = match;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3.5 p-4 text-left active:bg-stone-50/50 transition-colors duration-150"
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-amber-50 overflow-hidden flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-rose-400">
              {user.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-stone-900">{user.name}</p>
          <p className="text-[12px] text-stone-400 mt-0.5">@{user.username}</p>
          {user.bio && <p className="text-[12px] text-stone-500 mt-1 line-clamp-1">{user.bio}</p>}
        </div>

        {/* Score */}
        <div className={`px-3 py-1.5 rounded-xl text-[15px] font-bold ${SCORE_STYLE(score)}`}>
          {score}%
        </div>
      </button>

      {/* Expanded */}
      {expanded && breakdown && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="border-t border-stone-100 pt-3 space-y-2.5">
            {(Object.entries(BREAKDOWN_LABELS) as [keyof typeof BREAKDOWN_LABELS, typeof BREAKDOWN_LABELS[keyof typeof BREAKDOWN_LABELS]][]).map(
              ([key, { label, color }]) => {
                const val = breakdown[key];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] font-medium text-stone-500">{label}</span>
                      <span className="text-[12px] font-bold text-stone-700">{val}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700 ease-out`}
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
            className="mt-4 block w-full text-center py-3 rounded-2xl bg-stone-900 text-white text-[14px] font-semibold active:scale-[0.98] transition-all duration-200"
          >
            View Profile
          </Link>
        </div>
      )}
    </div>
  );
}
