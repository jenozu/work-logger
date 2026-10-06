"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { WorkLog } from "./types";

const timeZone = "America/Toronto";

function dayKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
function dayLabel(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
function time(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function History() {
  const [logs, setLogs] = useState<WorkLog[]>([]);

  useEffect(() => {
    fetch("/api/logs", { cache: "no-store" })
      .then((response) => {
        if (response.status === 401) {
          window.location.href = "/login";
          throw new Error("Unauthorized");
        }
        return response.json();
      })
      .then((data) => setLogs(data.logs ?? []))
      .catch(() => undefined);
  }, []);

  const groups = useMemo(() => {
    const grouped = new Map<string, WorkLog[]>();
    for (const log of logs) {
      const key = dayKey(log.created_at);
      grouped.set(key, [...(grouped.get(key) ?? []), log]);
    }
    return [...grouped.values()];
  }, [logs]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>History</h1>
          <div className="muted">Your most recent 500 entries</div>
        </div>
        <Link className="button-link secondary" href="/">Today</Link>
      </header>

      {groups.length === 0 ? (
        <section className="card"><p className="muted">No entries yet.</p></section>
      ) : (
        groups.map((group) => (
          <section className="card day-group" key={dayKey(group[0].created_at)}>
            <div className="day-label">{dayLabel(group[0].created_at)}</div>
            {group.map((log) => (
              <div className="log-row" key={log.id}>
                <div className="time">{time(log.created_at)}</div>
                <div className="entry">{log.entry}</div>
              </div>
            ))}
          </section>
        ))
      )}
    </main>
  );
}
