"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Wallet-based sign-in via Supabase's native Sign-In-With-Ethereum (EIP-4361).
 * No email, no SMTP, no rate limit — the wallet signs a message and Supabase
 * Auth issues a normal session. Uses window.ethereum directly, so it does not
 * pull in wagmi.
 *
 * Requires: Supabase → Auth → Providers → "Web3 Wallet" enabled, and the login
 * page URL in the redirect allow-list.
 */
export function WalletSignIn({ next }: { next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    if (
      typeof window === "undefined" ||
      !(window as { ethereum?: unknown }).ethereum
    ) {
      setError("No Ethereum wallet found. Install MetaMask or a similar wallet.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithWeb3({
        chain: "ethereum",
        statement: "Sign in to Artwall with your wallet.",
      });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "Wallet sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signIn}
        disabled={busy}
      >
        {busy ? "Check your wallet…" : "Continue with wallet"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
