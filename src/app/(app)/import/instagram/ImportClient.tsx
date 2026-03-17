"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Candidate {
  instagramId: string;
  caption: string;
  photoUrl: string | null;
  permalink: string;
  timestamp: string;
  extractedLocation: {
    name: string;
    city: string;
    country: string;
  } | null;
  alreadyImported: boolean;
}

interface SelectedItem {
  instagramId: string;
  locationName: string;
  city: string;
  country: string;
  rating: number;
  photoUrl?: string;
  visitedDate: string;
  caption?: string;
}

type Step = "connect" | "loading" | "review" | "importing" | "done";

export default function ImportClient({
  userId,
  isConnected,
}: {
  userId: string;
  isConnected: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [step, setStep] = useState<Step>(isConnected ? "loading" : "connect");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [importedCount, setImportedCount] = useState(0);
  const [fetchError, setFetchError] = useState("");

  // Auto-fetch media when connected
  useEffect(() => {
    if (isConnected && step === "loading") {
      fetchMedia();
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMedia = async () => {
    setStep("loading");
    setFetchError("");
    try {
      const res = await fetch("/api/instagram/media");
      if (!res.ok) {
        const data = await res.json();
        if (data.code === "NOT_CONNECTED") {
          setStep("connect");
          return;
        }
        throw new Error(data.error || "Failed to fetch");
      }
      const data = await res.json();
      setTotalPosts(data.total);
      setCandidates(data.candidates);

      // Pre-select all candidates with locations that aren't already imported
      const preselect = new Set<string>();
      const defaultRatings: Record<string, number> = {};
      for (const c of data.candidates) {
        if (c.extractedLocation && !c.alreadyImported) {
          preselect.add(c.instagramId);
          defaultRatings[c.instagramId] = 4;
        }
      }
      setSelected(preselect);
      setRatings(defaultRatings);
      setStep("review");
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Something went wrong");
      setStep("connect");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setRating = (id: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [id]: rating }));
  };

  const handleImport = async () => {
    setStep("importing");
    const items: SelectedItem[] = candidates
      .filter((c) => selected.has(c.instagramId) && c.extractedLocation)
      .map((c) => ({
        instagramId: c.instagramId,
        locationName: c.extractedLocation!.name,
        city: c.extractedLocation!.city,
        country: c.extractedLocation!.country,
        rating: ratings[c.instagramId] ?? 4,
        photoUrl: c.photoUrl ?? undefined,
        visitedDate: c.timestamp,
        caption: c.caption,
      }));

    try {
      const res = await fetch("/api/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      setImportedCount(data.imported);
      setStep("done");
    } catch {
      setFetchError("Import failed. Please try again.");
      setStep("review");
    }
  };

  const withLocations = candidates.filter((c) => c.extractedLocation && !c.alreadyImported);
  const alreadyImported = candidates.filter((c) => c.alreadyImported);

  return (
    <div className="min-h-full bg-stone-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-stone-200/50 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-stone-400 active:text-stone-600 transition-colors text-[14px] font-medium"
        >
          Cancel
        </button>
        <h1 className="text-[17px] font-bold text-stone-900 flex-1 text-center pr-10">
          Import from Instagram
        </h1>
      </header>

      <div className="px-5 pt-6">
        {/* Error banner */}
        {(error || fetchError) && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-100">
            <p className="text-[13px] text-rose-600 font-medium">
              {error === "denied"
                ? "Instagram access was denied. Please try again."
                : error === "token_failed"
                ? "Failed to connect Instagram. Please try again."
                : fetchError}
            </p>
          </div>
        )}

        {/* Step: Connect */}
        {step === "connect" && (
          <div className="flex flex-col items-center text-center pt-16 animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 via-rose-500 to-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-rose-200/40">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">
              Connect Instagram
            </h2>
            <p className="text-[14px] text-stone-400 max-w-[280px] leading-relaxed mb-8">
              We&apos;ll analyze your post captions to find places you&apos;ve visited and import them as check-ins.
            </p>
            <a
              href="/api/instagram/auth"
              className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-rose-500 to-amber-500 text-white font-semibold text-[15px] text-center block active:scale-[0.98] transition-transform shadow-lg shadow-rose-300/30"
            >
              Connect Instagram
            </a>
            <p className="text-[12px] text-stone-300 mt-4 max-w-[260px]">
              We only read your posts. We never post, follow, or modify anything on your account.
            </p>
          </div>
        )}

        {/* Step: Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center text-center pt-20 animate-fade-in">
            <div className="w-12 h-12 border-3 border-stone-200 border-t-rose-500 rounded-full animate-spin mb-6" />
            <h2 className="text-lg font-semibold text-stone-900 mb-2">
              Analyzing your posts...
            </h2>
            <p className="text-[13px] text-stone-400">
              Scanning captions for places you&apos;ve been
            </p>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="animate-fade-in-up">
            {/* Summary */}
            <div className="mb-5 p-4 rounded-2xl bg-white border border-stone-100">
              <p className="text-[14px] text-stone-700">
                Found <span className="font-bold text-stone-900">{withLocations.length}</span> places
                from <span className="font-bold text-stone-900">{totalPosts}</span> posts
                {alreadyImported.length > 0 && (
                  <span className="text-stone-400"> · {alreadyImported.length} already imported</span>
                )}
              </p>
            </div>

            {/* Candidates */}
            {withLocations.length === 0 ? (
              <div className="flex flex-col items-center text-center pt-12">
                <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2C8 2 4 6 4 10c0 5.25 7 11.5 7.68 12.07a.5.5 0 0 0 .64 0C13 21.5 20 15.25 20 10c0-4-4-8-8-8z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-800 mb-1">No locations found</h3>
                <p className="text-[13px] text-stone-400 max-w-[260px]">
                  We couldn&apos;t extract any place names from your post captions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {withLocations.map((c, i) => (
                  <CandidateCard
                    key={c.instagramId}
                    candidate={c}
                    index={i}
                    isSelected={selected.has(c.instagramId)}
                    rating={ratings[c.instagramId] ?? 4}
                    onToggle={() => toggleSelect(c.instagramId)}
                    onRating={(r) => setRating(c.instagramId, r)}
                  />
                ))}
              </div>
            )}

            {/* Import button */}
            {selected.size > 0 && (
              <div className="fixed bottom-20 left-0 right-0 px-5 max-w-app mx-auto">
                <button
                  onClick={handleImport}
                  className="w-full py-4 rounded-2xl btn-brand text-[15px]"
                >
                  Import {selected.size} Check-in{selected.size !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="flex flex-col items-center text-center pt-20 animate-fade-in">
            <div className="w-12 h-12 border-3 border-stone-200 border-t-rose-500 rounded-full animate-spin mb-6" />
            <h2 className="text-lg font-semibold text-stone-900 mb-2">
              Importing check-ins...
            </h2>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="flex flex-col items-center text-center pt-16 animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">
              {importedCount} check-in{importedCount !== 1 ? "s" : ""} imported!
            </h2>
            <p className="text-[14px] text-stone-400 mb-8">
              Your Instagram experiences are now in Away Together.
            </p>
            <button
              onClick={() => router.push("/feed")}
              className="w-full max-w-sm py-4 rounded-2xl bg-stone-900 text-white font-semibold text-[15px] active:scale-[0.98] transition-transform"
            >
              View Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  index,
  isSelected,
  rating,
  onToggle,
  onRating,
}: {
  candidate: Candidate;
  index: number;
  isSelected: boolean;
  rating: number;
  onToggle: () => void;
  onRating: (r: number) => void;
}) {
  const loc = candidate.extractedLocation!;
  const date = new Date(candidate.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`card overflow-hidden animate-fade-in-up transition-all duration-200 ${
        isSelected ? "ring-2 ring-rose-400 ring-offset-2" : "opacity-60"
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <button
        onClick={onToggle}
        className="w-full flex gap-3.5 p-4 text-left active:bg-stone-50/50"
      >
        {/* Photo */}
        {candidate.photoUrl ? (
          <img
            src={candidate.photoUrl}
            alt={loc.name}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C8 2 4 6 4 10c0 5.25 7 11.5 7.68 12.07a.5.5 0 0 0 .64 0C13 21.5 20 15.25 20 10c0-4-4-8-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-stone-900 truncate">{loc.name}</p>
          <p className="text-[12px] text-stone-400 mt-0.5">{loc.city}, {loc.country} · {date}</p>
          {candidate.caption && (
            <p className="text-[12px] text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
              {candidate.caption}
            </p>
          )}
        </div>

        {/* Checkbox */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${
          isSelected ? "border-rose-500 bg-rose-500" : "border-stone-200"
        }`}>
          {isSelected && (
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>
      </button>

      {/* Rating selector (when selected) */}
      {isSelected && (
        <div className="px-4 pb-3.5 pt-0 flex items-center gap-2 animate-fade-in">
          <span className="text-[11px] text-stone-400 font-medium">Rating:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={(e) => { e.stopPropagation(); onRating(n); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all active:scale-90 ${
                  n <= rating
                    ? "bg-amber-50 text-amber-500"
                    : "text-stone-200"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
