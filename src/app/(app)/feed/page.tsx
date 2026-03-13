import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FeedClient from "./FeedClient";

export const metadata = { title: "Feed · Away Together" };

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  return <FeedClient userId={session!.user.id} />;
}
