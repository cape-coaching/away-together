import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateCheckinSchema = z.object({
  rating:      z.number().min(1).max(5).optional(),
  reviewText:  z.string().optional(),
  occasionTag: z.string().optional(),
  photoUrls:   z.array(z.string()).optional(),
});

// GET /api/checkins/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const checkin = await prisma.checkin.findUnique({
    where:   { id: params.id },
    include: { location: true, user: { select: { id: true, username: true, name: true, avatarUrl: true } } },
  });

  if (!checkin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(checkin);
}

// PATCH /api/checkins/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkin = await prisma.checkin.findUnique({ where: { id: params.id } });
  if (!checkin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (checkin.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = UpdateCheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.checkin.update({
    where:   { id: params.id },
    data:    parsed.data,
    include: { location: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/checkins/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkin = await prisma.checkin.findUnique({ where: { id: params.id } });
  if (!checkin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (checkin.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.checkin.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
