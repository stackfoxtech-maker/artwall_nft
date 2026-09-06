import { SiteHeader } from "@/components/site-header";
import { LegalNotice } from "@/components/legal-notice";

export const metadata = { title: "Privacy Policy — Artwall 3.0" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-2xl py-10">
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: draft</p>
        <LegalNotice />

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-semibold text-foreground">Data we hold</h2>
            <p>
              Account email (via Supabase Auth), certificate details you enter,
              uploaded artwork, wallet addresses you connect, and blockchain
              transaction hashes. Private notes and unlockable content are stored
              off-chain and are not published.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">On-chain data</h2>
            <p>
              Minting writes the metadata URI and your wallet address to a public
              blockchain permanently. We keep personal information off-chain so it
              can be corrected or deleted; only content hashes and the wallet
              address are public and immutable.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">Your rights</h2>
            <p>
              You can request access to, correction of, or deletion of your
              off-chain personal data. Deletion removes your account, draft
              certificates, and uploaded files; it cannot remove data already
              written to a blockchain.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">Processors</h2>
            <p>
              Supabase (auth &amp; database), Pinata (IPFS storage), Vercel
              (hosting), and the blockchain RPC provider. We do not sell personal
              data.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">Contact</h2>
            <p>Data requests: add a contact address before launch.</p>
          </section>
        </div>
      </main>
    </>
  );
}
