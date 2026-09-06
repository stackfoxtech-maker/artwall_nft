import { describe, it, expect } from "vitest";
import { ipfsToHttp, shortAddress, cn } from "./utils";

describe("ipfsToHttp", () => {
  it("expands ipfs:// URIs against the configured gateway", () => {
    process.env.NEXT_PUBLIC_PINATA_GATEWAY = "gw.example.cloud";
    expect(ipfsToHttp("ipfs://bafkreiabc")).toBe(
      "https://gw.example.cloud/ipfs/bafkreiabc",
    );
  });

  it("accepts a bare CID", () => {
    process.env.NEXT_PUBLIC_PINATA_GATEWAY = "gw.example.cloud";
    expect(ipfsToHttp("bafkreiabc")).toBe(
      "https://gw.example.cloud/ipfs/bafkreiabc",
    );
  });

  it("strips a /ipfs/ prefix", () => {
    process.env.NEXT_PUBLIC_PINATA_GATEWAY = "gw.example.cloud";
    expect(ipfsToHttp("/ipfs/bafkreiabc")).toBe(
      "https://gw.example.cloud/ipfs/bafkreiabc",
    );
  });
});

describe("shortAddress", () => {
  it("truncates the middle", () => {
    expect(shortAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234…5678",
    );
  });
  it("returns empty for nullish", () => {
    expect(shortAddress(null)).toBe("");
    expect(shortAddress(undefined)).toBe("");
  });
});

describe("cn", () => {
  it("merges and dedupes tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
