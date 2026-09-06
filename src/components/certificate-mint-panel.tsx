"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { artwallCoaAbi } from "@/lib/abi";
import { NFT_CONTRACT_ADDRESS } from "@/lib/wagmi";

type Phase =
  | "idle"
  | "authorizing"
  | "signing"
  | "confirming"
  | "minted"
  | "failed";

interface VoucherResponse {
  voucher: {
    to: `0x${string}`;
    uri: string;
    royaltyReceiver: `0x${string}`;
    royaltyFeeBps: number;
    nonce: `0x${string}`;
    deadline: number;
  };
  signature: `0x${string}`;
}

export function CertificateMintPanel({
  certificateId,
}: {
  certificateId: string;
}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [bps, setBps] = useState(500);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const { data: txHash, writeContractAsync } = useWriteContract();
  const { isSuccess: broadcast } = useWaitForTransactionReceipt({ hash: txHash });
  const poll = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(poll.current), []);

  const confirm = useCallback(async () => {
    const res = await fetch(`/api/certificates/${certificateId}/confirm`, {
      method: "POST",
    });
    const json = (await res.json()) as { status?: string; error?: string };
    if (json.status === "MINTED") {
      clearInterval(poll.current);
      setPhase("minted");
      router.refresh();
    } else if (json.status === "FAILED") {
      clearInterval(poll.current);
      setPhase("failed");
      setError(json.error ?? "The mint did not succeed on-chain.");
      router.refresh();
    }
  }, [certificateId, router]);

  // Report the broadcast tx to the server, then poll /confirm.
  useEffect(() => {
    if (!broadcast || !txHash || phase !== "signing") return;
    (async () => {
      await fetch(`/api/certificates/${certificateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ txHash }),
      });
      setPhase("confirming");
      void confirm();
      poll.current = setInterval(confirm, 4000);
    })();
  }, [broadcast, txHash, phase, certificateId, confirm]);

  async function mint() {
    if (!address) return;
    setError(null);
    setPhase("authorizing");
    try {
      const res = await fetch(
        `/api/certificates/${certificateId}/mint-voucher`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            to: address,
            royaltyReceiver: address,
            royaltyFeeBps: bps,
          }),
        },
      );
      if (!res.ok) throw new Error("Could not get a mint authorization.");
      const { voucher, signature } = (await res.json()) as VoucherResponse;

      setPhase("signing");
      await writeContractAsync({
        abi: artwallCoaAbi,
        address: NFT_CONTRACT_ADDRESS!,
        functionName: "mintWithVoucher",
        args: [
          {
            to: voucher.to,
            uri: voucher.uri,
            royaltyReceiver: voucher.royaltyReceiver,
            royaltyFeeBps: BigInt(voucher.royaltyFeeBps),
            nonce: voucher.nonce,
            deadline: BigInt(voucher.deadline),
          },
          signature,
        ],
      });
    } catch (e) {
      setPhase("failed");
      setError((e as Error).message.split("\n")[0]);
    }
  }

  const busy = phase !== "idle" && phase !== "failed" && phase !== "minted";

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
          disabled={busy}
        />
        <span className="text-xs text-muted-foreground">
          {(bps / 100).toFixed(2)}% to {address ?? "your connected wallet"}
        </span>
      </div>

      <Button
        onClick={mint}
        disabled={!isConnected || !NFT_CONTRACT_ADDRESS || busy}
      >
        {phase === "authorizing"
          ? "Authorizing…"
          : phase === "signing"
            ? "Confirm in wallet…"
            : phase === "confirming"
              ? "Verifying on-chain…"
              : phase === "minted"
                ? "Minted ✓"
                : "Mint NFT"}
      </Button>

      {!isConnected && (
        <p className="text-xs text-muted-foreground">Connect a wallet to mint.</p>
      )}
      {!NFT_CONTRACT_ADDRESS && (
        <p className="text-xs text-muted-foreground">
          Contract address not configured.
        </p>
      )}
      {phase === "minted" && (
        <p className="text-xs text-green-600">Minted and verified on-chain.</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
