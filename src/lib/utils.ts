import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ipfsToHttp(uri: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "ipfs.io";
  const cid = uri.replace(/^ipfs:\/\//, "").replace(/^\/ipfs\//, "");
  return `https://${gateway}/ipfs/${cid}`;
}

export function shortAddress(addr?: string | null): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
