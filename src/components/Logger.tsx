"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
function time(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function todayLabel() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export default function Logger() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/logs", { cache: "no-store" });
    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await response.json();
    setLogs(data.logs ?? []);
  }

  useEffect(() => { void load(); }, []);

  const todaysLogs = useMemo(
    () => logs.filter((log) => dayKey(log.created_at) === todayKey()),
    [logs]
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const clean = entry.trim();
    if (!clean) return;
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry: clean }),
    });
    setBusy(false);
    if (!response.ok) {
      setStatus("Could not save that entry.");
      return;
    }
    const data = await response.json();
    setLogs((current) => [data.log, ...current]);
    setEntry("");
    setStatus("Saved.");
  }

  async function edit(log: WorkLog) {
    const next = window.prompt("Edit entry", log.entry)?.trim();
    if (!next || next === log.entry) return;
    const response = await fetch("/api/logs/" + log.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry: next }),
    });
    if (response.ok) {
      const data = await response.json();
      setLogs((current) =>
        current.map((item) => (item.id === log.id ? data.log : item))
      );
    }
  }

  async function remove(log: WorkLog) {
    if (!window.confirm("Delete this entry?")) return;
    const response = await fetch("/api/logs/" + log.id, { method: "DELETE" });
    if (response.ok) {
      setLogs((current) => current.filter((item) => item.id !== log.id));
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Work Logger</h1>
          <div className="muted">{todayLabel()}</div>
        </div>
        <nav className="nav">
          <Link className="button-link secondary" href="/history">History</Link>
          <button className="secondary" onClick={logout}>Log out</button>
        </nav>
      </header>

      <section className="card">
        <form onSubmit={submit}>
          <textarea
            maxLength={1000}
            placeholder="What did you do?"
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
            autoFocus
          />
          <div className="actions">
            <button type="submit" disabled={busy || !entry.trim()}>
              {busy ? "Saving…" : "Log task"}
            </button>
          </div>
          <div className="status">{status}</div>
        </form>
      </section>

      <section className="card">
        <h2>Today</h2>
        {todaysLogs.length === 0 ? (
          <p className="muted">No entries yet.</p>
        ) : (
          todaysLogs.map((log) => (
            <div className="log-row" key={log.id}>
              <div className="time">{time(log.created_at)}</div>
              <div className="entry">{log.entry}</div>
              <div className="row-actions">
                <button onClick={() => edit(log)}>Edit</button>
                <button onClick={() => remove(log)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
