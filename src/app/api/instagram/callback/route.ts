import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exchangeCodeForToken } from "@/lib/instagram";
import { prisma } from "@/lib/prisma";

// GET /api/instagram/callback — handle OAuth redirect from Instagram
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/import/instagram?error=denied", req.url)
    );
  }

  try {
    const { accessToken, userId: igUserId } = await exchangeCodeForToken(code);

    // Store token on user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        instagramAccessToken: accessToken,
        instagramUserId: igUserId,
      },
    });

    return NextResponse.redirect(new URL("/import/instagram", req.url));
  } catch (err) {
    console.error("Instagram callback error:", err);
    return NextResponse.redirect(
      new URL("/import/instagram?error=token_failed", req.url)
    );
  }
}
