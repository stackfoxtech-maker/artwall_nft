# Deploying Artwall 3.0 to Vercel

## Environment variables to set in Vercel

Project → Settings → Environment Variables. Mark the secret ones as **Sensitive**.

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` | update after first deploy |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cfyesjrdhyxrjbrffajn.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_bXSrF_Cva58kNN8TLc3nFg_yqivhBMl` | publishable, safe to expose |
| `DATABASE_URL` | pooled connection, `...:6543/...?pgbouncer=true&schema=artwall` | **Sensitive** |
| `DIRECT_URL` | session connection, `...:5432/...?schema=artwall` | **Sensitive** |
| `PINATA_JWT` | (from `.env`) | **Sensitive** |
| `NEXT_PUBLIC_PINATA_GATEWAY` | `amaranth-capable-vulture-184.mypinata.cloud` | |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `6fef5f80e1d82b7a5046c34cc7e2b47e` | |
| `NEXT_PUBLIC_DEFAULT_CHAIN_ID` | `84532` | Base Sepolia |
| `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` | `0xd54C599DF055FE13D3bb88C8395124764609B395` | |
| `MINT_SIGNER_PRIVATE_KEY` | (from `.env`) | **Sensitive** — holds no funds but signs vouchers |
| `NEXT_PUBLIC_MINT_SIGNER_ADDRESS` | `0xc2941C98643f6D4D353FCa59EFf12e2b9D456094` | |
| `CRON_SECRET` | generate a fresh random string | **Sensitive** — used by the mint-reconcile cron |
| `BASE_SEPOLIA_RPC_URL` | `https://sepolia.base.org` | replace with an Alchemy/QuickNode URL for reliability |

Do **not** set `DEPLOYER_PRIVATE_KEY` in Vercel — it is only for local contract deploys.

## After the first deploy

1. Set `NEXT_PUBLIC_APP_URL` to the real deployment URL and redeploy.
2. **Supabase → Authentication → URL Configuration**: add
   `https://<your-project>.vercel.app/**` to *Redirect URLs* and set the *Site URL*,
   or magic links and email confirmation will bounce.
3. The `vercel.json` cron (`/api/cron/reconcile-mints` every 5 min) activates
   automatically on a production deploy; it needs `CRON_SECRET` set.

## Known limitations of this deploy

- Contract is on **Base Sepolia testnet** — mints are not real assets.
- Database is **shared** with another project (isolated by the `artwall` schema).
  Move to a dedicated Supabase project before real use.
- Rate limiting is in-memory (per instance). Add Upstash Redis for multi-region.
- No Sentry yet — add via `npx @sentry/wizard`.
