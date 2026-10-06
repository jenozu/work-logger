import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { requestIsAuthenticated } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  if (!requestIsAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    SELECT id, entry, created_at
    FROM work_logs
    ORDER BY created_at DESC
    LIMIT 500
  `;
  return NextResponse.json({ logs: rows });
}

export async function POST(request: NextRequest) {
  if (!requestIsAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const entry = typeof body?.entry === "string" ? body.entry.trim() : "";
  if (!entry || entry.length > 1000) {
    return NextResponse.json(
      { error: "Entry must be between 1 and 1000 characters" },
      { status: 400 }
    );
  }
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    INSERT INTO work_logs (entry)
    VALUES (${entry})
    RETURNING id, entry, created_at
  `;
  return NextResponse.json({ log: rows[0] }, { status: 201 });
}
