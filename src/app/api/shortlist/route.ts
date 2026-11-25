import { NextRequest, NextResponse } from "next/server";
import { getJosaaColleges } from "@/lib/josaa-colleges";

const cookie = "jee-shortlist-session";

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

async function request(path: string, token?: string, init?: RequestInit) {
  const setup = config();
  if (!setup) throw new Error("Shortlist unavailable");
  const headers = new Headers(init?.headers);
  headers.set("apikey", setup.key);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body) headers.set("Content-Type", "application/json");
  return fetch(setup.url + path, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(10000) });
}

export async function GET(req: NextRequest) {
  if (!config()) return reply({ enabled: false });
  const token = req.cookies.get(cookie)?.value;
  if (!token) return reply({ enabled: true, signedIn: false });
  try {
    const res = await request("/rest/v1/saved_colleges?select=college_id&order=saved_at.desc", token);
    if (res.status === 401) return reply({ enabled: true, signedIn: false });
    if (!res.ok) return reply({ error: "Could not load your shortlist." }, 502);
    const saved: { college_id: string }[] = await res.json();
    const campuses = getJosaaColleges();
    return reply({ enabled: true, signedIn: true, colleges: saved.map(({ college_id: id }) => ({
      id, name: campuses.get(id)?.[0]?.institute ?? id,
    })) });
  } catch {
    return reply({ error: "Could not load your shortlist." }, 502);
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin !== req.nextUrl.origin) return reply({ error: "Invalid request origin." }, 403);
  if (!config()) return reply({ error: "Private shortlists are unavailable." }, 503);
  const form = await req.json().catch(() => null);
  const action = form?.action;
  const token = req.cookies.get(cookie)?.value;
  if (action === "logout") {
    const response = reply({ signedIn: false });
    response.cookies.delete(cookie);
    return response;
  }

  try {
    if (action === "login" || action === "signup") {
      const email = typeof form.email === "string" ? form.email.trim() : "";
      const password = typeof form.password === "string" ? form.password : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
          password.length < (action === "signup" ? 8 : 1) || password.length > 128) {
        return reply({ error: "Enter a valid email and password. New passwords need at least 8 characters." }, 400);
      }
      const data = action === "signup" ? {
        name: typeof form.name === "string" ? form.name.trim().slice(0, 100) : "",
        phone: typeof form.phone === "string" ? form.phone.trim().slice(0, 32) : "",
      } : undefined;
      const res = await request(action === "signup" ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password", undefined, {
        method: "POST", body: JSON.stringify({ email, password, data }),
      });
      if (res.status === 429) return reply({ error: "Too many attempts. Try again later." }, 429);
      if (!res.ok) return reply({ error: action === "login" ? "Sign-in failed. Check your email, password and email confirmation." : "Account creation failed. If you already have an account, sign in." }, 400);
      const session = await res.json();
      if (!session.access_token) return reply({ message: "Check your email to confirm the account, then sign in." });
      const response = reply({ signedIn: true });
      response.cookies.set(cookie, session.access_token, {
        httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/",
        maxAge: Number(session.expires_in) || 3600,
      });
      return response;
    }

    if (action !== "save" && action !== "remove") return reply({ error: "Invalid action." }, 400);
    if (!token) return reply({ error: "Sign in to change your shortlist." }, 401);
    const id = form.id;
    if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{0,159}$/.test(id) ||
        (action === "save" && !getJosaaColleges().has(id))) {
      return reply({ error: "Unknown college." }, 400);
    }
    const save = action === "save";
    const res = await request(save ? "/rest/v1/saved_colleges?on_conflict=user_id,college_id"
      : `/rest/v1/saved_colleges?college_id=eq.${id}`, token, save ? {
      method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ college_id: id }),
    } : { method: "DELETE" });
    if (!res.ok) return reply({ error: res.status === 401 ? "Please sign in again." : "Could not update your shortlist." }, res.status === 401 ? 401 : 502);
    return reply({ updated: true });
  } catch {
    return reply({ error: "Could not connect to private shortlists. Try again shortly." }, 502);
  }
}
