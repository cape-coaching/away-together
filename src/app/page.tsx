import { redirect } from "next/navigation";

// Root → redirect to feed (layout will handle auth guard)
export default function RootPage() {
  redirect("/feed");
}
