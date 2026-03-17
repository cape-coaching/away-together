import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInstagramAuthUrl } from "@/lib/instagram";
import crypto from "crypto";

// GET /api/instagram/auth — redirect user to Instagram OAuth
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const url = getInstagramAuthUrl(state);

  return NextResponse.redirect(url);
}
