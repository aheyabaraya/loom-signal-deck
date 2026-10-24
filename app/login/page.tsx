"use client";

import { useState, type FormEvent } from "react";
import { sendMagicLink, signInWithOAuth } from "../../lib/harne/client";
import { isSupabaseConfigured } from "../../lib/supabase/env";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleProvider(provider: "google" | "github") {
    setBusy(true);
    setStatus("");
    try {
      await signInWithOAuth(provider);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "OAuth sign-in failed.");
      setBusy(false);
    }
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setBusy(true);
    setStatus("");
    try {
      await sendMagicLink(email.trim());
      setStatus("Check your inbox for the sign-in link.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Magic link could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell harne-login-shell">
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <section className="harne-login-card" aria-labelledby="login-title">
        <p className="eyebrow">Harne Access</p>
        <h1 id="login-title">Enter the signal room.</h1>
        <p>
          Use a real account for persistent participation, or return to the vote page and start an
          anonymous demo session.
        </p>

        {!isSupabaseConfigured() ? (
          <div className="harne-auth-notice" role="alert">
            Supabase URL and publishable key are not configured in this environment yet.
          </div>
        ) : null}

        <div className="harne-login-actions">
          <button disabled={busy || !isSupabaseConfigured()} onClick={() => handleProvider("google")} type="button">
            Continue with Google
          </button>
          <button disabled={busy || !isSupabaseConfigured()} onClick={() => handleProvider("github")} type="button">
            Continue with GitHub
          </button>
        </div>

        <div className="harne-login-divider" aria-hidden="true">
          <span>or email link</span>
        </div>

        <form className="harne-login-form" onSubmit={handleMagicLink}>
          <label htmlFor="harne-email">Email address</label>
          <input
            autoComplete="email"
            disabled={busy || !isSupabaseConfigured()}
            id="harne-email"
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          <button disabled={busy || !email.trim() || !isSupabaseConfigured()} type="submit">
            {busy ? "Working..." : "Send magic link"}
          </button>
        </form>

        <p className="harne-auth-status" aria-live="polite">
          {status}
        </p>
        <a className="harne-back-link" href="/vote">
          Back to Harne Vote →
        </a>
      </section>
    </main>
  );
}
