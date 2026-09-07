"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const E164 = /^\+[1-9]\d{7,14}$/;

/**
 * Phone / SMS one-time-code sign-in via Supabase. No email involved.
 * Requires an SMS provider configured in Supabase → Auth → Providers → Phone
 * (Twilio, Vonage, MessageBird, or Textlocal). If none is set up, the send step
 * surfaces Supabase's error.
 */
export function PhoneSignIn({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    if (!E164.test(phone)) {
      setError("Enter your number in international format, e.g. +14155551234");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setStep("code");
    } catch (e) {
      setError((e as Error).message || "Could not send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code.trim(),
        type: "sms",
      });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "That code did not verify.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {step === "phone" ? (
        <>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+14155551234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={send}
            disabled={busy}
          >
            {busy ? "Sending…" : "Text me a code"}
          </Button>
        </>
      ) : (
        <>
          <Label htmlFor="code">Code sent to {phone}</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={verify}
              disabled={busy || code.length < 4}
            >
              {busy ? "Verifying…" : "Verify"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
            >
              Change number
            </Button>
          </div>
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
