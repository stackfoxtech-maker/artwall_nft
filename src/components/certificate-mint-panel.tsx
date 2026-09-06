"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { MintButton } from "@/components/mint-button";

type Phase = "idle" | "reporting" | "confirming" | "minted" | "failed";

export function CertificateMintPanel({
  certificateId,
  metadataUri,
}: {
  certificateId: string;
  metadataUri: string;
}) {
  const router = useRouter();
  const { address } = useAccount();
  const [bps, setBps] = useState(500);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(poll.current), []);

  const confirm = useCallback(async () => {
    const res = await fetch(`/api/certificates/${certificateId}/confirm`, {
      method: "POST",
    });
    const json = (await res.json()) as {
      status?: string;
      tokenId?: string;
      error?: string;
    };
    if (json.status === "MINTED") {
      clearInterval(poll.current);
      setPhase("minted");
      router.refresh();
    } else if (json.status === "FAILED") {
      clearInterval(poll.current);
      setPhase("failed");
      setError(json.error ?? "The mint transaction did not succeed on-chain.");
      router.refresh();
    }
  }, [certificateId, router]);

  // The client only ever reports the broadcast tx; the server confirms it.
  const onBroadcast = useCallback(
    async (txHash: `0x${string}`) => {
      setError(null);
      setPhase("reporting");
      const res = await fetch(`/api/certificates/${certificateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ txHash }),
      });
      if (!res.ok) {
        setPhase("failed");
        setError("Could not record the transaction. It may still confirm — refresh in a minute.");
        return;
      }
      setPhase("confirming");
      void confirm();
      poll.current = setInterval(confirm, 4000);
    },
    [certificateId, confirm],
  );

  return (
    <div className="space-y-4">
      <WalletConnectButton />

      <div className="flex max-w-xs flex-col gap-1.5">
        <Label htmlFor="bps">Secondary-sale royalty (basis points)</Label>
        <Input
          id="bps"
          type="number"
          min={0}
          max={10000}
          value={bps}
          onChange={(e) => setBps(Number(e.target.value))}
          disabled={phase !== "idle"}
        />
        <span className="text-xs text-muted-foreground">
          {(bps / 100).toFixed(2)}% to {address ?? "your connected wallet"}
        </span>
      </div>

      <MintButton
        metadataUri={metadataUri}
        royaltyReceiver={address}
        royaltyFeeBps={bps}
        disabled={phase !== "idle"}
        onMinted={onBroadcast}
      />

      {phase === "reporting" && (
        <p className="text-xs text-muted-foreground">Recording transaction…</p>
      )}
      {phase === "confirming" && (
        <p className="text-xs text-muted-foreground">
          Waiting for on-chain confirmation…
        </p>
      )}
      {phase === "minted" && (
        <p className="text-xs text-green-600">Minted and verified on-chain.</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
