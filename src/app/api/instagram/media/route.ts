import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchUserMedia } from "@/lib/instagram";
import { extractLocationsFromCaptions } from "@/lib/instagram-location";

// GET /api/instagram/media — fetch user's Instagram posts and extract locations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { instagramAccessToken: true },
  });

  if (!user?.instagramAccessToken) {
    return NextResponse.json(
      { error: "Instagram not connected", code: "NOT_CONNECTED" },
      { status: 400 }
    );
  }

  try {
    // Fetch media from Instagram
    const media = await fetchUserMedia(user.instagramAccessToken, 50);

    // Get existing imported post IDs to mark duplicates
    const existingIds = new Set(
      (
        await prisma.checkin.findMany({
          where: {
            userId: session.user.id,
            instagramPostId: { not: null },
          },
          select: { instagramPostId: true },
        })
      ).map((c) => c.instagramPostId)
    );

    // Extract locations using Claude
    const candidates = await extractLocationsFromCaptions(media);

    // Mark already-imported posts
    const results = candidates.map((c) => ({
      ...c,
      alreadyImported: existingIds.has(c.instagramId),
    }));

    return NextResponse.json({
      total: media.length,
      withLocations: results.filter((r) => r.extractedLocation).length,
      candidates: results,
    });
  } catch (err) {
    console.error("Instagram media fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Instagram media" },
      { status: 500 }
    );
  }
}
