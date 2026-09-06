"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithMagicLink,
} from "./actions";

type Mode = "signin" | "signup" | "magic";
const initial = {} as { error?: string; message?: string };

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("signin");

  const action =
    mode === "signin"
      ? signInWithPassword
      : mode === "signup"
        ? signUpWithPassword
        : signInWithMagicLink;

  const [state, formAction] = useFormState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      {mode !== "magic" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.message && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}

      <SubmitButton mode={mode} />

      <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
        {mode !== "signin" && (
          <button type="button" className="underline" onClick={() => setMode("signin")}>
            Sign in with password
          </button>
        )}
        {mode !== "signup" && (
          <button type="button" className="underline" onClick={() => setMode("signup")}>
            Create an account
          </button>
        )}
        {mode !== "magic" && (
          <button type="button" className="underline" onClick={() => setMode("magic")}>
            Email me a magic link
          </button>
        )}
      </div>
    </form>
  );
}

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const label =
    mode === "signin"
      ? "Sign in"
      : mode === "signup"
        ? "Create account"
        : "Send magic link";
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Working…" : label}
    </Button>
  );
}
