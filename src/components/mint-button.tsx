"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { artwallCoaAbi } from "@/lib/abi";
import { NFT_CONTRACT_ADDRESS } from "@/lib/wagmi";

interface MintButtonProps {
  metadataUri: string;
  royaltyReceiver: `0x${string}`;
  royaltyFeeBps: number;
  onMinted?: (txHash: `0x${string}`) => void;
}

export function MintButton({
  metadataUri,
  royaltyReceiver,
  royaltyFeeBps,
  onMinted,
}: MintButtonProps) {
  const { address, isConnected } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  if (isSuccess && hash) onMinted?.(hash);

  const disabled =
    !isConnected || !address || !NFT_CONTRACT_ADDRESS || isPending || isConfirming;

  return (
    <div className="space-y-2">
      <Button
        disabled={disabled}
        onClick={() =>
          writeContract({
            abi: artwallCoaAbi,
            address: NFT_CONTRACT_ADDRESS!,
            functionName: "mintCertificate",
            args: [
              address!,
              metadataUri,
              royaltyReceiver,
              BigInt(royaltyFeeBps),
            ],
          })
        }
      >
        {isPending
          ? "Confirm in wallet…"
          : isConfirming
            ? "Minting…"
            : "Mint NFT"}
      </Button>
      {!NFT_CONTRACT_ADDRESS && (
        <p className="text-xs text-muted-foreground">
          Set NEXT_PUBLIC_NFT_CONTRACT_ADDRESS after deploying the contract.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
