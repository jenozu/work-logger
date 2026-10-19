"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const timeZone = "America/Toronto";

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

type Values = Record<string, string>;

function todayInToronto() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}

function weekday(date: string) {
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  return day >= 1 && day <= 5;
}

function emptyValues(): Values {
  return Object.fromEntries(slots.map(([key]) => [key, ""]));
}

export default function DailyLog() {
  const [date, setDate] = useState(todayInToronto());
  const [values, setValues] = useState<Values>(emptyValues());
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [from, setFrom] = useState(todayInToronto());
  const [to, setTo] = useState(todayInToronto());

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(date + "T12:00:00Z"));
  }, [date]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatus("");

      const response = await fetch("/api/daily?date=" + encodeURIComponent(date), {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const next = emptyValues();

      if (response.ok) {
        const data = await response.json();
        for (const item of data.entries ?? []) {
          if (typeof item?.slot_key === "string") {
            next[item.slot_key] = String(item.task ?? "");
          }
        }
      }

      if (!cancelled) {
        setValues(next);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [date]);

  async function save() {
    if (!weekday(date)) {
      setStatus("Please choose a Monday through Friday.");
      return;
    }

    setSaving(true);
    setStatus("");

    const response = await fetch("/api/daily", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        entries: slots.map(([slotKey]) => ({
          slotKey,
          task: values[slotKey] ?? "",
        })),
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data.error ?? "Could not save this daily log.");
      return;
    }

    setStatus("Daily log saved.");
  }

  function exportCsv() {
    if (!from || !to || from > to) {
      setStatus("Choose a valid From and To date.");
      return;
    }

    window.location.href =
      "/api/daily/export?from=" +
      encodeURIComponent(from) +
      "&to=" +
      encodeURIComponent(to);
  }

  return (
    <main className="shell daily-shell">
      <header className="topbar">
        <div>
          <h1>Daily Log Sheet</h1>
          <div className="muted">Hourly work record for management</div>
        </div>
        <nav className="nav">
          <Link className="button-link secondary" href="/">Quick Log</Link>
          <Link className="button-link secondary" href="/history">History</Link>
        </nav>
      </header>

      <section className="card">
        <div className="field-row">
          <label>
            <span className="field-label">Work date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <div className="selected-date">
            <span className="field-label">Selected day</span>
            <strong>{dateLabel}</strong>
          </div>
        </div>

        {!weekday(date) && (
          <p className="warning">Daily sheets are intended for Monday through Friday.</p>
        )}
      </section>

      <section className="card">
        <h2>Tasks by time block</h2>

        {loading ? (
          <p className="muted">Loading daily log…</p>
        ) : (
          <div className="daily-grid">
            {slots.map(([slotKey, label]) => (
              <label className="daily-row" key={slotKey}>
                <span className="slot-label">{label}</span>
                <textarea
                  rows={2}
                  maxLength={2000}
                  value={values[slotKey] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [slotKey]: event.target.value,
                    }))
                  }
                  placeholder="Task(s) completed during this time"
                />
              </label>
            ))}
          </div>
        )}

        <div className="actions">
          <button onClick={save} disabled={saving || loading || !weekday(date)}>
            {saving ? "Saving…" : "Save daily log"}
          </button>
        </div>
        <div className="status">{status}</div>
      </section>

      <section className="card">
        <h2>Export CSV</h2>
        <p className="muted">
          Creates a management-ready sheet with every weekday and time block in the selected range.
        </p>

        <div className="field-row export-row">
          <label>
            <span className="field-label">From</span>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label>
            <span className="field-label">To</span>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <button type="button" onClick={exportCsv}>Download CSV</button>
        </div>
      </section>
    </main>
  );
}
