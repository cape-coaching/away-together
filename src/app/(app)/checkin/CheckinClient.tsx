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

  const [query, setQuery]           = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelected]  = useState<PlaceSuggestion | null>(null);
  const searchTimer                   = useRef<ReturnType<typeof setTimeout>>();

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
    if (!place.locationId) {
      await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googlePlaceId: place.placeId, name: place.mainText, address: place.description,
          lat: 0, lng: 0, placeType: "restaurant",
          city: place.secondaryText?.split(",")[0]?.trim() ?? "Unknown",
          country: place.secondaryText?.split(",").pop()?.trim() ?? "Unknown",
          countryCode: "XX",
        }),
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await fetch("/api/upload", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    const { uploadUrl, publicUrl } = await res.json();
    await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    setPhotos((prev) => [...prev, publicUrl]);
  };

  const handleSubmit = async () => {
    if (!selectedPlace || rating === 0) { setError("Select a place and give it a rating."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/checkins", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedPlace.locationId ?? selectedPlace.placeId,
          rating, reviewText: review, occasionTag: occasion || undefined, photoUrls: photos,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      router.push("/feed");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-white/60 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 active:text-gray-600 transition-colors text-[15px]">
          ← Back
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900 flex-1">New Check-in</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 space-y-8">
        {/* Place search */}
        <div>
          <label className="block text-[13px] font-medium text-gray-900 mb-2 tracking-wide">WHERE</label>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search restaurants, cafes, landmarks..."
              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/50 transition-shadow"
            />
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                {suggestions.map((s) => (
                  <li key={s.placeId}>
                    <button
                      onClick={() => handleSelectPlace(s)}
                      className="w-full text-left px-4 py-3.5 active:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <p className="text-[14px] font-medium text-gray-900">{s.mainText}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">{s.secondaryText}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Star rating */}
        <div>
          <label className="block text-[13px] font-medium text-gray-900 mb-3 tracking-wide">RATING</label>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all duration-200 active:scale-90 ${
                  n <= rating
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div>
          <label className="block text-[13px] font-medium text-gray-900 mb-3 tracking-wide">OCCASION</label>
          <div className="flex flex-wrap gap-2">
            {OCCASION_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setOccasion(occasion === tag ? "" : tag)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  occasion === tag
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 text-gray-500 border border-gray-100"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Review */}
        <div>
          <label className="block text-[13px] font-medium text-gray-900 mb-2 tracking-wide">
            REVIEW <span className="text-gray-300 font-normal">optional</span>
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
            placeholder="What made this place memorable?"
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/50 resize-none transition-shadow"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-[13px] font-medium text-gray-900 mb-3 tracking-wide">PHOTOS</label>
          <div className="flex gap-3 flex-wrap">
            {photos.map((url) => (
              <img key={url} src={url} alt="" className="w-20 h-20 rounded-xl object-cover" />
            ))}
            <label className="w-20 h-20 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center cursor-pointer active:bg-gray-100 transition-colors">
              <span className="text-xl text-gray-300">+</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        {error && <p className="text-[13px] text-red-400 font-medium">{error}</p>}
      </div>

      {/* Save */}
      <div className="fixed bottom-20 left-0 right-0 px-5 max-w-app mx-auto">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-4 rounded-xl bg-gray-900 text-white font-medium text-[15px] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Check-in"}
        </button>
      </div>
    </div>
  );
}
