// Extract locations from Instagram captions using Claude + Google Places

import type { InstagramMedia } from "./instagram";

export interface LocationCandidate {
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
}

export async function extractLocationsFromCaptions(
  posts: InstagramMedia[]
): Promise<LocationCandidate[]> {
  // Filter to image posts that have captions
  const candidates = posts.filter(
    (p) => p.caption && (p.media_type === "IMAGE" || p.media_type === "CAROUSEL_ALBUM")
  );

  if (candidates.length === 0) return [];

  // Build a single prompt with all captions for efficiency
  const captionList = candidates.map((p, i) => `[${i}] "${p.caption}"`).join("\n");

  const prompt = `You are analyzing Instagram captions to extract location/place mentions for a travel app.

For each caption below, extract the specific place name (restaurant, bar, museum, landmark, hotel, beach, park, etc.) and the city/country if mentioned or inferrable.

Return a JSON array with one entry per caption index. Each entry should be:
- { "index": <number>, "name": "<place name>", "city": "<city>", "country": "<country>" }
- If no specific location/place can be identified, return { "index": <number>, "name": null, "city": null, "country": null }

Be generous — hashtags like #tokyo or #parislife count as city references. Location names in any language are fine. Look for restaurant names, landmarks, neighborhoods, etc.

Captions:
${captionList}

Return ONLY the JSON array, no other text.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error("Claude API error:", await res.text());
    // Return all candidates with null locations
    return candidates.map((p) => ({
      instagramId: p.id,
      caption: p.caption ?? "",
      photoUrl: p.media_url ?? p.thumbnail_url ?? null,
      permalink: p.permalink,
      timestamp: p.timestamp,
      extractedLocation: null,
    }));
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "[]";

  let extracted: Array<{ index: number; name: string | null; city: string | null; country: string | null }>;
  try {
    // Handle potential markdown code block wrapping
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    extracted = JSON.parse(jsonStr);
  } catch {
    extracted = [];
  }

  return candidates.map((post, i) => {
    const match = extracted.find((e) => e.index === i);
    return {
      instagramId: post.id,
      caption: post.caption ?? "",
      photoUrl: post.media_url ?? post.thumbnail_url ?? null,
      permalink: post.permalink,
      timestamp: post.timestamp,
      extractedLocation:
        match?.name
          ? { name: match.name, city: match.city ?? "Unknown", country: match.country ?? "Unknown" }
          : null,
    };
  });
}
