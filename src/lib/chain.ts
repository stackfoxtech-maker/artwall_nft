import "server-only";
import {
  createPublicClient,
  http,
  parseAbiItem,
  type Hex,
  type Address,
} from "viem";
import { base, baseSepolia, polygon, polygonAmoy } from "viem/chains";

const CHAINS = { [base.id]: base, [baseSepolia.id]: baseSepolia, [polygon.id]: polygon, [polygonAmoy.id]: polygonAmoy } as const;

export const DEFAULT_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID ?? baseSepolia.id,
);

export const NFT_CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS ?? ""
).toLowerCase() as Address;

/** Per-chain RPC. Falls back to the chain's public RPC if no private one is set. */
function rpcUrl(chainId: number): string | undefined {
  if (chainId === baseSepolia.id) return process.env.BASE_SEPOLIA_RPC_URL;
  if (chainId === base.id) return process.env.BASE_RPC_URL;
  if (chainId === polygon.id) return process.env.POLYGON_RPC_URL;
  if (chainId === polygonAmoy.id) return process.env.POLYGON_AMOY_RPC_URL;
  return undefined;
}

export function publicClientFor(chainId: number) {
  const chain = CHAINS[chainId as keyof typeof CHAINS];
  if (!chain) throw new Error(`unsupported chainId ${chainId}`);
  return createPublicClient({ chain, transport: http(rpcUrl(chainId)) });
}

const certificateMintedEvent = parseAbiItem(
  "event CertificateMinted(uint256 indexed tokenId, address indexed to, string uri)",
);

export type MintVerdict =
  | { state: "pending" }
  | { state: "confirmed"; tokenId: string; contractAddr: Address; chainId: number }
  | { state: "failed"; reason: string };

/**
 * Authoritative check of a mint transaction. Never trust the client's claim of
 * success or of the tokenId — derive both from the on-chain receipt + logs.
 */
export async function verifyMintTx(
  txHash: Hex,
  chainId = DEFAULT_CHAIN_ID,
): Promise<MintVerdict> {
  const client = publicClientFor(chainId);

  const receipt = await client
    .getTransactionReceipt({ hash: txHash })
    .catch(() => null);

  if (!receipt) return { state: "pending" };
  if (receipt.status !== "success") {
    return { state: "failed", reason: "transaction reverted" };
  }
  if (receipt.to?.toLowerCase() !== NFT_CONTRACT_ADDRESS) {
    return { state: "failed", reason: "transaction did not target the Artwall contract" };
  }

  const logs = await client.getLogs({
    address: NFT_CONTRACT_ADDRESS,
    event: certificateMintedEvent,
    blockHash: receipt.blockHash,
  });
  const mintLog = logs.find((l) => l.transactionHash === txHash);
  if (!mintLog || mintLog.args.tokenId === undefined) {
    return { state: "failed", reason: "no CertificateMinted event in this transaction" };
  }

  return {
    state: "confirmed",
    tokenId: mintLog.args.tokenId.toString(),
    contractAddr: NFT_CONTRACT_ADDRESS,
    chainId,
  };
}
