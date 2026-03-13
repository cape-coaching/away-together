import { Metadata } from "next";
import MatchClient from "./MatchClient";

export const metadata: Metadata = { title: "Traveler Match · Away Together" };

export default function MatchPage() {
  return <MatchClient />;
}
