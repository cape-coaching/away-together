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
    <div className="flex flex-col h-full bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-stone-200/50 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-stone-400 active:text-stone-600 transition-colors text-[14px] font-medium">
          Cancel
        </button>
        <h1 className="text-[17px] font-bold text-stone-900 flex-1 text-center pr-10">New Check-in</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 space-y-7">
        {/* Place search */}
        <div className="animate-fade-in-up">
          <label className="section-label block mb-2.5">Where</label>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search restaurants, cafes, landmarks..."
              className="w-full bg-white border border-stone-200/80 rounded-2xl px-4 py-3.5 text-[15px] text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all shadow-sm"
            />
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden z-20">
                {suggestions.map((s) => (
                  <li key={s.placeId}>
                    <button
                      onClick={() => handleSelectPlace(s)}
                      className="w-full text-left px-4 py-3.5 active:bg-stone-50 transition-colors border-b border-stone-50 last:border-0"
                    >
                      <p className="text-[14px] font-medium text-stone-900">{s.mainText}</p>
                      <p className="text-[12px] text-stone-400 mt-0.5">{s.secondaryText}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Star rating */}
        <div className="animate-fade-in-up delay-50">
          <label className="section-label block mb-3">Rating</label>
          <div className="flex gap-2.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition-all duration-200 active:scale-90 ${
                  n <= rating
                    ? "bg-amber-50 border-2 border-amber-300 shadow-sm shadow-amber-100"
                    : "bg-white border border-stone-200/80"
                }`}
              >
                <span className={n <= rating ? "text-amber-500" : "text-stone-200"}>★</span>
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div className="animate-fade-in-up delay-100">
          <label className="section-label block mb-3">Occasion</label>
          <div className="flex flex-wrap gap-2">
            {OCCASION_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setOccasion(occasion === tag ? "" : tag)}
                className={`chip ${occasion === tag ? "chip-active" : "chip-inactive"}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Review */}
        <div className="animate-fade-in-up delay-150">
          <label className="section-label block mb-2.5">
            Review <span className="text-stone-300 font-normal normal-case">optional</span>
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
            placeholder="What made this place memorable?"
            className="w-full bg-white border border-stone-200/80 rounded-2xl px-4 py-3.5 text-[15px] text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 resize-none transition-all shadow-sm"
          />
        </div>

        {/* Photos */}
        <div className="animate-fade-in-up delay-200">
          <label className="section-label block mb-3">Photos</label>
          <div className="flex gap-3 flex-wrap">
            {photos.map((url) => (
              <img key={url} src={url} alt="" className="w-20 h-20 rounded-2xl object-cover border border-stone-100" />
            ))}
            <label className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-stone-200 flex items-center justify-center cursor-pointer active:bg-stone-50 transition-colors">
              <svg className="w-6 h-6 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        {error && <p className="text-[13px] text-rose-500 font-medium">{error}</p>}
      </div>

      {/* Save */}
      <div className="fixed bottom-20 left-0 right-0 px-5 max-w-app mx-auto">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-4 rounded-2xl btn-brand text-[15px] disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Check-in"}
        </button>
      </div>
    </div>
  );
}
