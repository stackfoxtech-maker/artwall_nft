"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LoginForm } from "./login-form";
import { WalletSignIn } from "@/components/wallet-sign-in";
import { PhoneSignIn } from "@/components/phone-sign-in";

type Method = "email" | "phone" | "wallet";

const TABS: { id: Method; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "wallet", label: "Wallet" },
];

export function AuthPanel({ next }: { next: string }) {
  const [method, setMethod] = useState<Method>("email");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
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
