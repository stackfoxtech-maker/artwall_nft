// Minimal ABI for the Artwall COA ERC-721 contract (see contracts/ArtwallCOA.sol).
export const artwallCoaAbi = [
  {
    type: "function",
    name: "mintCertificate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "uri", type: "string" },
      { name: "royaltyReceiver", type: "address" },
      { name: "royaltyFeeBps", type: "uint96" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "event",
    name: "CertificateMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "uri", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;
