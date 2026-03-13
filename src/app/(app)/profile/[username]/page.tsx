import { Metadata } from "next";
import ProfileClient from "./ProfileClient";

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `@${params.username} · Away Together` };
}

export default function ProfilePage({ params }: Props) {
  return <ProfileClient username={params.username} />;
}
