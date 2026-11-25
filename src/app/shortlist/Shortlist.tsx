"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import styles from "./shortlist.module.css";

type State = { enabled: boolean; signedIn?: boolean; colleges?: { id: string; name: string }[] };

export default function Shortlist({ college }: { college?: string }) {
  const [state, setState] = useState<State | null>(null);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch("/api/shortlist", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setState(data);
  }

  useEffect(() => { refresh().catch(() => setError("Could not load your shortlist.")); }, []);

  async function send(body: object) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/shortlist", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) await refresh();
        throw new Error(result.error);
      }
      if (result.message) {
        setRegister(false);
        setNotice(result.message);
      }
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update your shortlist.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    void send({ action: register ? "signup" : "login", ...values });
  }

  if (!state) return <p role="status">{error || "Loading private shortlist…"}</p>;
  if (!state.enabled) return <p>Private shortlists are currently unavailable. You can still <Link href="/colleges">browse the free college directory</Link>.</p>;
  const alreadySaved = state.colleges?.some(item => item.id === college);
  return <div className={styles.panel}>
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {state.signedIn ? <>
      {college && <button disabled={busy || alreadySaved} onClick={() => void send({ action: "save", id: college })}>{alreadySaved ? "Already saved" : "Save this college"}</button>}
      <h2>Saved colleges</h2>
      {state.colleges?.length ? <ul>{state.colleges.map(item => <li key={item.id}>
        <Link href={`/college/${item.id}`}>{item.name}</Link>
        <button disabled={busy} type="button" onClick={() => void send({ action: "remove", id: item.id })}>Remove</button>
      </li>)}</ul> : <p>Open any <Link href="/colleges">college profile</Link> to start your list.</p>}
      <button type="button" disabled={busy} onClick={() => void send({ action: "logout" })}>Sign out</button>
    </> : <>
      <h2>{register ? "Create a shortlist account" : "Sign in to your shortlist"}</h2>
      <form onSubmit={submit}>
        {register && <>
          <label>Name <input name="name" autoComplete="name" maxLength={100} /></label>
          <label>Phone (optional) <input name="phone" type="tel" autoComplete="tel" maxLength={32} /></label>
        </>}
        <label>Email <input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Password <input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 8 : undefined} maxLength={128} /></label>
        <button disabled={busy}>{register ? "Create account" : "Sign in"}</button>
      </form>
      <button type="button" disabled={busy} onClick={() => { setRegister(!register); setError(""); }}>{register ? "Back to sign in" : "Create an account"}</button>
    </>}
  </div>;
}
