import { NextRequest } from "next/server";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";

export function requestIsAuthenticated(request: NextRequest) {
  return isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
}
