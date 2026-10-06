import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { requestIsAuthenticated } from "@/lib/api-auth";

type Context = { params: Promise<{ id: string }> };

function validId(value: string) {
  return /^\d+$/.test(value);
}

export async function PATCH(request: NextRequest, context: Context) {
  if (!requestIsAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  if (!validId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
    UPDATE work_logs
    SET entry = ${entry}
    WHERE id = ${id}
    RETURNING id, entry, created_at
  `;
  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ log: rows[0] });
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!requestIsAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  if (!validId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await ensureSchema();
  const sql = db();
  await sql`DELETE FROM work_logs WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
