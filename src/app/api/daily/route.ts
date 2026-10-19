import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { requestIsAuthenticated } from "@/lib/api-auth";

const validSlots = new Set([
  "07:00-08:00",
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-16:30",
]);

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isWeekday(value: string) {
  const day = new Date(value + "T12:00:00Z").getUTCDay();
  return day >= 1 && day <= 5;
}

export async function GET(request: NextRequest) {
  if (!requestIsAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get("date") ?? "";

  if (!validDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  await ensureSchema();
  const sql = db();

  const rows = await sql`
    SELECT slot_key, task
    FROM daily_log_entries
    WHERE work_date = ${date}::date
    ORDER BY slot_key
  `;

  return NextResponse.json({ entries: rows });
}

export async function PUT(request: NextRequest) {
  if (!requestIsAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : "";
  const entries: unknown[] = Array.isArray(body?.entries) ? body.entries : [];

  if (!validDate(date) || !isWeekday(date)) {
    return NextResponse.json(
      { error: "Daily sheets are limited to Monday through Friday" },
      { status: 400 }
    );
  }

  const cleaned = entries
    .filter(
      (item: unknown): item is { slotKey: string; task: string } =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { slotKey?: unknown }).slotKey === "string" &&
        typeof (item as { task?: unknown }).task === "string"
    )
    .map((item) => ({
      slotKey: item.slotKey,
      task: item.task.trim().slice(0, 2000),
    }))
    .filter((item) => validSlots.has(item.slotKey));

  if (cleaned.length !== validSlots.size) {
    return NextResponse.json(
      { error: "All time blocks must be included" },
      { status: 400 }
    );
  }

  await ensureSchema();
  const sql = db();

  for (const item of cleaned) {
    await sql`
      INSERT INTO daily_log_entries (work_date, slot_key, task)
      VALUES (${date}::date, ${item.slotKey}, ${item.task})
      ON CONFLICT (work_date, slot_key)
      DO UPDATE SET task = EXCLUDED.task, updated_at = NOW()
    `;
  }

  return NextResponse.json({ ok: true });
}
