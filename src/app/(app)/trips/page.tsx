import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TripsClient from "./TripsClient";

export const metadata = { title: "Trips · Away Together" };

export default async function TripsPage() {
  const session = await getServerSession(authOptions);
  return <TripsClient userId={session!.user.id} />;
}
