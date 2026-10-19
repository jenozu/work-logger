import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DailyLog from "@/components/DailyLog";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";

export default async function DailyPage() {
  const cookieStore = await cookies();
  const authenticated = isValidSession(cookieStore.get(SESSION_COOKIE)?.value);

  if (!authenticated) redirect("/login");

  return <DailyLog />;
}
