"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

type ActionResult = { error?: string; message?: string };

const credsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function clientIp() {
  const h = headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `https://${headers().get("host") ?? "localhost:3000"}`
  );
}

async function guard(bucket: string, limit: number): Promise<ActionResult | null> {
  const rl = await checkRateLimit(`${bucket}:${clientIp()}`, {
    limit,
    windowSec: 900,
  });
  if (!rl.ok) {
    log.warn("auth rate limit hit", { bucket, ip: clientIp() });
    return { error: "Too many attempts. Try again in a few minutes." };
  }
  return null;
}

export async function signInWithPassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const limited = await guard("signin", 10);
  if (limited) return limited;

  const parsed = credsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Deliberately vague — don't reveal whether the email exists.
  if (error) return { error: "Invalid email or password." };

  redirect(next);
}

export async function signUpWithPassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const limited = await guard("signup", 5);
  if (limited) return limited;

  const parsed = credsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };

  if (data.session) redirect(next);
  return { message: "Check your email to confirm your account, then sign in." };
}

export async function signInWithMagicLink(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const limited = await guard("magic", 5);
  if (limited) return limited;

  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address" };
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };
  return { message: "Magic link sent — check your email." };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
