import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { requestIsAuthenticated } from "@/lib/api-auth";

const slots = [
  ["07:00-08:00", "7:00 AM - 8:00 AM"],
  ["08:00-09:00", "8:00 AM - 9:00 AM"],
  ["09:00-10:00", "9:00 AM - 10:00 AM"],
  ["10:00-11:00", "10:00 AM - 11:00 AM"],
  ["11:00-12:00", "11:00 AM - 12:00 PM"],
  ["12:00-13:00", "12:00 PM - 1:00 PM"],
  ["13:00-14:00", "1:00 PM - 2:00 PM"],
  ["14:00-15:00", "2:00 PM - 3:00 PM"],
  ["15:00-16:00", "3:00 PM - 4:00 PM"],
  ["16:00-16:30", "4:00 PM - 4:30 PM"],
] as const;

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function csv(value: string) {
  return '"' + value.replaceAll('"', '""') + '"';
}

function datesBetween(from: string, to: string) {
  const start = new Date(from + "T12:00:00Z");
  const end = new Date(to + "T12:00:00Z");
  const dates: string[] = [];

  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const day = cursor.getUTCDay();
    if (day >= 1 && day <= 5) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
  }

  return dates;
}

export async function GET(request: NextRequest) {
  if (!requestIsAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";

  if (!validDate(from) || !validDate(to) || from > to) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  await ensureSchema();
  const sql = db();

  const rows = await sql`
    SELECT work_date::text AS work_date, slot_key, task
    FROM daily_log_entries
    WHERE work_date BETWEEN ${from}::date AND ${to}::date
    ORDER BY work_date, slot_key
  `;

  const lookup = new Map<string, string>();
  for (const row of rows) {
    lookup.set(String(row.work_date) + "|" + String(row.slot_key), String(row.task ?? ""));
  }

  const lines = [
    ["Date", "Day", "Time Block", "Task"].map(csv).join(","),
  ];

  for (const date of datesBetween(from, to)) {
    const dayName = new Intl.DateTimeFormat("en-CA", {
      weekday: "long",
      timeZone: "UTC",
    }).format(new Date(date + "T12:00:00Z"));

    for (const [slotKey, label] of slots) {
      const task = lookup.get(date + "|" + slotKey) ?? "";
      lines.push([date, dayName, label, task].map(csv).join(","));
    }
  }

  return new NextResponse(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="work-log-${from}-to-${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
