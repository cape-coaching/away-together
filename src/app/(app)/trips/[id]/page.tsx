import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TripDetailClient from "./TripDetailClient";

export const metadata = { title: "Trip · Away Together" };

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  return <TripDetailClient itineraryId={id} userId={session!.user.id} />;
}
