import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/itineraries/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, name: true, avatarUrl: true } },
      items: {
        orderBy: { orderIndex: "asc" },
        include: {
          checkin: {
            include: {
              location: true,
            },
          },
        },
      },
      _count: { select: { forks: true } },
    },
  });

  if (!itinerary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Draft itineraries are only visible to the owner
  if (itinerary.visibility === "draft" && itinerary.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id:           itinerary.id,
    title:        itinerary.title,
    description:  itinerary.description,
    destination:  itinerary.destination,
    startDate:    itinerary.startDate,
    endDate:      itinerary.endDate,
    visibility:   itinerary.visibility,
    tags:         itinerary.tags,
    forkedFromId: itinerary.forkedFromId,
    forkCount:    itinerary._count.forks,
    user:         itinerary.user,
    items: itinerary.items.map((item) => ({
      id:           item.id,
      locationName: item.locationName,
      notes:        item.notes,
      dayNumber:    item.dayNumber,
      orderIndex:   item.orderIndex,
      checkin: item.checkin ? {
        id:        item.checkin.id,
        rating:    item.checkin.rating,
        reviewText: item.checkin.reviewText,
        occasionTag: item.checkin.occasionTag,
        visitedDate: item.checkin.visitedDate,
        photoUrls: item.checkin.photoUrls,
        location:  item.checkin.location,
      } : null,
    })),
    createdAt: itinerary.createdAt,
    updatedAt: itinerary.updatedAt,
  });
}

const UpdateSchema = z.object({
  title:       z.string().min(1).optional(),
  description: z.string().optional(),
  visibility:  z.enum(["draft", "public"]).optional(),
});

// PATCH /api/itineraries/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const itinerary = await prisma.itinerary.findUnique({ where: { id } });
  if (!itinerary || itinerary.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body   = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.itinerary.update({
    where: { id },
    data:  parsed.data,
  });

  return NextResponse.json(updated);
}
