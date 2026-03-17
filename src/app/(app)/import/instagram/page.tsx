import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ImportClient from "./ImportClient";

export const metadata = { title: "Import from Instagram · Away Together" };

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { instagramAccessToken: true, instagramUserId: true },
  });

  return (
    <ImportClient
      userId={session!.user.id}
      isConnected={!!user?.instagramAccessToken}
    />
  );
}
