"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("Incorrect PIN.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="login">
      <div className="card">
        <h1>Work Logger</h1>
        <p className="muted">Enter your PIN to continue.</p>
        <form onSubmit={submit}>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN"
            autoFocus
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? "Checking…" : "Continue"}
          </button>
          <div className="status">{error}</div>
        </form>
      </div>
    </main>
  );
}
