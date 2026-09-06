"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; message?: string };

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    `https://${headers().get("host") ?? "localhost:3000"}`
  );
}

export async function signInWithPassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(next);
}

export async function signUpWithPassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };

  // If email confirmation is disabled, a session is returned immediately.
  if (data.session) redirect(next);
  return { message: "Check your email to confirm your account, then sign in." };
}

export async function signInWithMagicLink(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
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
