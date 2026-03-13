// ─── Shared TypeScript types ─────────────────────────────────────────────────
// These mirror the Prisma models but are safe to import in client components.

export type OccasionTag =
  | "food"
  | "culture"
  | "nightlife"
  | "adventure"
  | "sightseeing"
  | "luxury";

export type Visibility = "draft" | "public";

export interface UserSummary {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface LocationSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  placeType: string;
}

export interface CheckinWithDetails {
  id: string;
  userId: string;
  user: UserSummary;
  location: LocationSummary;
  rating: number;
  reviewText: string | null;
  occasionTag: OccasionTag | null;
  visitedDate: string; // ISO string (serialized from Date)
  photoUrls: string[];
  createdAt: string;
}

export interface ItinerarySummary {
  id: string;
  userId: string;
  user: UserSummary;
  title: string;
  description: string | null;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  visibility: Visibility;
  forkedFromId: string | null;
  tags: string[];
  itemCount: number;
  createdAt: string;
}

export interface UserStats {
  checkinsCount: number;
  countriesCount: number;
  citiesCount: number;
  followersCount: number;
  followingCount: number;
  itinerariesCount: number;
}

// Match algorithm types
export interface MatchBreakdown {
  geo: number;
  taste: number;
  style: number;
  engagement: number;
}

export interface TravelerMatch {
  user: UserSummary;
  score: number;
  breakdown: MatchBreakdown;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

// API error shape
export interface ApiError {
  error: string;
  code?: string;
}
