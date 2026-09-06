import "server-only";
import { PinataSDK } from "pinata";

if (!process.env.PINATA_JWT) {
  // Do not throw at import time in dev so the app still boots without keys.
  console.warn("[pinata] PINATA_JWT is not set — IPFS uploads will fail.");
}

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT ?? "",
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "",
});

/** ERC-721 metadata shape we pin for each certificate. */
export interface NftMetadata {
  name: string;
  description: string;
  image: string; // ipfs://<cid>
  external_url?: string;
  attributes: { trait_type: string; value: string | number }[];
}
