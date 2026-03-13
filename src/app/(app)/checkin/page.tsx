import { Metadata } from "next";
import CheckinClient from "./CheckinClient";

export const metadata: Metadata = { title: "Log Check-in · Away Together" };

export default function CheckinPage() {
  return <CheckinClient />;
}
