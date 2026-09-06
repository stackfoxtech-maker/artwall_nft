"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { MintButton } from "@/components/mint-button";
import { NFT_CONTRACT_ADDRESS } from "@/lib/wagmi";

export function CertificateMintPanel({
  certificateId,
  metadataUri,
}: {
  certificateId: string;
  metadataUri: string;
}) {
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  const [bps, setBps] = useState(500);
  const [saving, setSaving] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  async function persistMint(txHash: `0x${string}`) {
    setSaving(true);
    setSavedError(null);
    try {
      const res = await fetch(`/api/certificates/${certificateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          txHash,
          chainId,
          contractAddr: NFT_CONTRACT_ADDRESS,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (e) {
      setSavedError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

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
        />
        <span className="text-xs text-muted-foreground">
          {(bps / 100).toFixed(2)}% to {address ?? "your connected wallet"}
        </span>
      </div>

      <MintButton
        metadataUri={metadataUri}
        royaltyReceiver={address}
        royaltyFeeBps={bps}
        onMinted={persistMint}
      />

      {saving && <p className="text-xs text-muted-foreground">Recording mint…</p>}
      {savedError && (
        <p className="text-xs text-destructive">
          Minted on-chain but failed to record: {savedError}
        </p>
      )}
    </div>
  );
}
