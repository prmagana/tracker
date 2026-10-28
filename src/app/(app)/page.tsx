import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";

// Signed-in home. Empty until Tracker gets its real surface.
export default async function Home() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  return <main className="w-full flex-1 px-4 sm:px-6" />;
}
