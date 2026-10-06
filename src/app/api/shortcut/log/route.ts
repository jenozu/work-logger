import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

function validApiKey(request: NextRequest) {
  const expected = process.env.SHORTCUT_API_KEY;
  if (!expected) throw new Error("SHORTCUT_API_KEY is not configured");

  const header = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;

  const received = header.slice(prefix.length);
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function POST(request: NextRequest) {
  if (!validApiKey(request)) {
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

  return NextResponse.json({ ok: true, log: rows[0] }, { status: 201 });
}
