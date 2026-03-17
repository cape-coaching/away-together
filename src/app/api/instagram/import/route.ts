import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ImportSchema = z.object({
  items: z.array(
    z.object({
      instagramId: z.string(),
      locationName: z.string(),
      city: z.string(),
      country: z.string(),
      rating: z.number().min(1).max(5),
      occasionTag: z.string().optional(),
      photoUrl: z.string().optional(),
      visitedDate: z.string(),
      caption: z.string().optional(),
    })
  ),
});

// POST /api/instagram/import — batch create check-ins from Instagram posts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const results: string[] = [];

  for (const item of parsed.data.items) {
    // Skip if already imported
    const existing = await prisma.checkin.findFirst({
      where: { userId, instagramPostId: item.instagramId },
    });
    if (existing) continue;

    // Upsert location
    const locationKey = `ig_${item.city}_${item.locationName}`.replace(/\s+/g, "_").toLowerCase();
    let location = await prisma.location.findFirst({
      where: { name: item.locationName, city: item.city },
    });

    if (!location) {
      location = await prisma.location.create({
        data: {
          name: item.locationName,
          city: item.city,
          country: item.country,
          countryCode: "XX", // We don't have ISO code from caption extraction
          lat: 0,
          lng: 0,
          placeType: "other",
          googlePlaceId: locationKey,
        },
      });
    }

    // Create check-in
    const checkin = await prisma.checkin.create({
      data: {
        userId,
        locationId: location.id,
        rating: item.rating,
        reviewText: item.caption ? item.caption.slice(0, 500) : null,
        occasionTag: item.occasionTag,
        visitedDate: new Date(item.visitedDate),
        photoUrls: item.photoUrl ? [item.photoUrl] : [],
        instagramPostId: item.instagramId,
      },
    });

    results.push(checkin.id);
  }

  return NextResponse.json({
    imported: results.length,
    checkinIds: results,
  });
}
