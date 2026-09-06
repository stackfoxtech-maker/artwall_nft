import "server-only";
import { createHash } from "node:crypto";
import type { Address } from "viem";
import { publicClientFor, DEFAULT_CHAIN_ID } from "@/lib/chain";
import { artwallCoaAbi } from "@/lib/abi";
import { ipfsToHttp } from "@/lib/utils";

export interface OnChainCheck {
  reachable: boolean;
  owner?: Address;
  tokenUri?: string;
  uriMatches?: boolean;
  metadataHashMatches?: boolean;
}

/**
 * Live verification for a minted certificate: reads the current owner and
 * tokenURI from the chain and re-checks the pinned metadata against the hash
 * recorded at issue time. Never throws — the page degrades gracefully.
 */
export async function checkOnChain(cert: {
  tokenId: string | null;
  contractAddr: string | null;
  chainId: number | null;
  metadataUri: string | null;
  metadataSha256: string | null;
}): Promise<OnChainCheck> {
  if (!cert.tokenId || !cert.contractAddr) return { reachable: false };

  try {
    const client = publicClientFor(cert.chainId ?? DEFAULT_CHAIN_ID);
    const address = cert.contractAddr as Address;
    const tokenId = BigInt(cert.tokenId);

    const [owner, tokenUri] = await Promise.all([
      client.readContract({ address, abi: artwallCoaAbi, functionName: "ownerOf", args: [tokenId] }),
      client.readContract({ address, abi: artwallCoaAbi, functionName: "tokenURI", args: [tokenId] }),
    ]);

    const uriMatches = !!cert.metadataUri && tokenUri === cert.metadataUri;

    let metadataHashMatches: boolean | undefined;
    if (uriMatches && cert.metadataSha256) {
      try {
        const res = await fetch(ipfsToHttp(tokenUri), { next: { revalidate: 300 } });
        const body = await res.text();
        metadataHashMatches =
          createHash("sha256").update(body).digest("hex") === cert.metadataSha256;
      } catch {
        metadataHashMatches = undefined;
      }
    }

    return { reachable: true, owner, tokenUri, uriMatches, metadataHashMatches };
  } catch {
    return { reachable: false };
  }
}
