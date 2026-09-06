# Artwall 3.0

Verisart-style SaaS for issuing blockchain-backed **Certificates of Authenticity**
and minting **NFTs** for physical and digital art.

## Stack

| Layer        | Choice                                                        |
|--------------|--------------------------------------------------------------|
| Frontend     | Next.js 14 (App Router, TS), Tailwind, shadcn/ui             |
| Web3         | wagmi v2 + viem, RainbowKit                                  |
| Contracts    | OpenZeppelin ERC-721 + ERC-2981, Hardhat (`/contracts`)      |
| Auth + DB    | Supabase Auth + Postgres, Prisma ORM                         |
| Storage      | Pinata (IPFS) for artwork + metadata                         |
| Hosting      | Vercel (web) · Supabase (DB) · Base Sepolia/Base (chain)     |

## Getting started

```bash
npm install
cp .env.example .env          # fill in Supabase, Pinata, WalletConnect
npm run prisma:generate
npm run prisma:migrate         # creates tables in Supabase (uses DIRECT_URL)
# then run supabase/schema.sql in the Supabase SQL editor (trigger + RLS)
npm run dev
```

### Contracts

```bash
cd contracts
npm install
npm test
npm run deploy:baseSepolia     # needs DEPLOYER_PRIVATE_KEY + testnet ETH
```

Copy the deployed address into `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS`.

## End-to-end flow

1. **Sign up** — Supabase Auth (email or wallet). A `public."User"` row is created by trigger.
2. **3-step wizard** (`/certificates/new`)
   - *Define* — creator, privacy, object type
   - *Create* — upload artwork → `POST /api/ipfs/upload` (Pinata); title/medium/dimensions
   - *Enhance* — private note, unlockable reward, QR/NFC link id
   - Submit → `POST /api/certificates` pins metadata JSON, writes a `METADATA_PINNED` row
3. **Mint** — `<MintButton>` calls `ArtwallCOA.mintCertificate(to, uri, royaltyReceiver, bps)` via RainbowKit/wagmi
4. **Verify** — public page at `/verify/[id]` (id = certificate id or `physicalLinkId`)

## What's stubbed / TODO

- Auth screens (`/login`, wallet sign-in) — Supabase client/server helpers are wired, UI is not.
- `POST /api/certificates` requires an authenticated session; add the login flow to exercise it.
- Persisting the mint result (txHash, tokenId) — add `PATCH /api/certificates/[id]` called from `onMinted`.
- Royalty split UI in the wizard (schema + contract already support it).
- Dashboard currently renders an empty list; wire it to `prisma.certificate.findMany`.
