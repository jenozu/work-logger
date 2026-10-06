import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Logger from "@/components/Logger";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authenticated = isValidSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!authenticated) redirect("/login");
  return <Logger />;
}
