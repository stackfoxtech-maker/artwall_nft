"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LoginForm } from "./login-form";
import { WalletSignIn } from "@/components/wallet-sign-in";
import { PhoneSignIn } from "@/components/phone-sign-in";

type Method = "email" | "phone" | "wallet";

// Phone/SMS login is only shown when an SMS provider is actually configured in
// Supabase. Set NEXT_PUBLIC_ENABLE_PHONE_AUTH=true once Twilio (or another
// provider) is working, including geo-permissions + DLT for the target country.
const PHONE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PHONE_AUTH === "true";

const TABS: { id: Method; label: string }[] = [
  { id: "email", label: "Email" },
  ...(PHONE_ENABLED ? [{ id: "phone" as const, label: "Phone" }] : []),
  { id: "wallet", label: "Wallet" },
];

export function AuthPanel({ next }: { next: string }) {
  const [method, setMethod] = useState<Method>("email");

  return (
    <div className="space-y-5">
      <div
        className="grid gap-1 rounded-md bg-muted p-1"
        style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMethod(t.id)}
            className={cn(
              "rounded px-2 py-1.5 text-sm font-medium transition-colors",
              method === t.id
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {method === "email" && <LoginForm next={next} />}
      {method === "phone" && <PhoneSignIn next={next} />}
      {method === "wallet" && <WalletSignIn next={next} />}
    </div>
  );
}
