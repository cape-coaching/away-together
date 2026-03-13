import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/locations?q=  — proxy to Google Places Autocomplete, then enrich from DB
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Places API not configured" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", q);
  url.searchParams.set("types", "establishment");
  url.searchParams.set("key", apiKey);

  const gRes  = await fetch(url.toString());
  const gData = await gRes.json();

  const predictions = (gData.predictions ?? []).slice(0, 5);

  // Check which places are already in our DB
  const placeIds = predictions
    .map((p: any) => p.place_id)
    .filter(Boolean);

  const existing = await prisma.location.findMany({
    where: { googlePlaceId: { in: placeIds } },
    select: { googlePlaceId: true, id: true, checkins: { select: { id: true } } },
  });
  const existingMap = new Map(existing.map((l) => [l.googlePlaceId, l]));

  const results = predictions.map((p: any) => {
    const inDb = existingMap.get(p.place_id);
    return {
      placeId:       p.place_id,
      description:   p.description,
      mainText:      p.structured_formatting?.main_text,
      secondaryText: p.structured_formatting?.secondary_text,
      locationId:    inDb?.id ?? null,
      checkinCount:  inDb?.checkins.length ?? 0,
    };
  });

  return NextResponse.json({ results });
}

// POST /api/locations  — upsert a location from a Google Place
const CreateLocationSchema = z.object({
  googlePlaceId: z.string(),
  name:          z.string(),
  address:       z.string().optional(),
  lat:           z.number(),
  lng:           z.number(),
  placeType:     z.string(),
  city:          z.string(),
  neighborhood:  z.string().optional(),
  country:       z.string(),
  countryCode:   z.string().length(2),
  googleMapsUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body   = await req.json();
  const parsed = CreateLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const location = await prisma.location.upsert({
    where:  { googlePlaceId: parsed.data.googlePlaceId },
    create: parsed.data,
    update: {
      name:    parsed.data.name,
      address: parsed.data.address,
      lat:     parsed.data.lat,
      lng:     parsed.data.lng,
    },
  });

  return NextResponse.json(location, { status: 201 });
}
