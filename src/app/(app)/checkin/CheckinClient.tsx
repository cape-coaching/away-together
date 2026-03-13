"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const OCCASION_TAGS = ["Solo", "Couple", "Friends", "Family", "Work", "Date Night"];

interface PlaceSuggestion {
  placeId:       string;
  description:   string;
  mainText:      string;
  secondaryText: string;
  locationId:    string | null;
}

export default function CheckinClient() {
  const router = useRouter();

  // Search
  const [query, setQuery]           = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelected]  = useState<PlaceSuggestion | null>(null);
  const searchTimer                   = useRef<ReturnType<typeof setTimeout>>();

  // Form
  const [rating, setRating]     = useState(0);
  const [review, setReview]     = useState("");
  const [occasion, setOccasion] = useState("");
  const [photos, setPhotos]     = useState<string[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const handleSearch = (val: string) => {
    setQuery(val);
    clearTimeout(searchTimer.current);
    if (val.length < 2) { setSuggestions([]); return; }
    searchTimer.current = setTimeout(async () => {
      const res  = await fetch(`/api/locations?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
    }, 300);
  };

  const handleSelectPlace = async (place: PlaceSuggestion) => {
    setSelected(place);
    setSuggestions([]);
    setQuery(place.mainText);

    // If not yet in DB, create it via Places Details API (handled server-side)
    if (!place.locationId) {
      await fetch("/api/locations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          googlePlaceId: place.placeId,
          name:          place.mainText,
          address:       place.description,
          // lat/lng/city/country would come from a Places Details call in prod
          lat:           0,
          lng:           0,
          placeType:     "restaurant",
          city:          place.secondaryText?.split(",")[0]?.trim() ?? "Unknown",
          country:       place.secondaryText?.split(",").pop()?.trim() ?? "Unknown",
          countryCode:   "XX",
        }),
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await fetch("/api/upload", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    const { uploadUrl, publicUrl } = await res.json();

    await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    setPhotos((prev) => [...prev, publicUrl]);
  };

  const handleSubmit = async () => {
    if (!selectedPlace || rating === 0) {
      setError("Please select a place and give it a rating.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/checkins", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          locationId:  selectedPlace.locationId ?? selectedPlace.placeId,
          rating,
          reviewText:  review,
          occasionTag: occasion || undefined,
          photoUrls:   photos,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/feed");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 transition-colors">
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1">Log a check-in</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-32 space-y-6">
        {/* Place search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Place</label>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search restaurants, cafés, landmarks…"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-20">
                {suggestions.map((s) => (
                  <li key={s.placeId}>
                    <button
                      onClick={() => handleSelectPlace(s)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{s.mainText}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.secondaryText}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Star rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`text-3xl transition-transform active:scale-90 ${n <= rating ? "opacity-100" : "opacity-25"}`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Occasion</label>
          <div className="flex flex-wrap gap-2">
            {OCCASION_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setOccasion(occasion === tag ? "" : tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  occasion === tag
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-sky-300"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Review */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Review <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
            placeholder="What made this place memorable?"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
          />
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((url) => (
              <img key={url} src={url} alt="" className="w-20 h-20 rounded-xl object-cover" />
            ))}
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-sky-400 transition-colors">
              <span className="text-2xl text-gray-400">+</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Save button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-app mx-auto">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-sky-500 text-white font-semibold text-base shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Check-in"}
        </button>
      </div>
    </div>
  );
}
