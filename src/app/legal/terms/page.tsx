import { SiteHeader } from "@/components/site-header";
import { LegalNotice } from "@/components/legal-notice";

export const metadata = { title: "Terms of Service — Artwall 3.0" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="container max-w-2xl py-10 prose-sm">
        <h1 className="text-2xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: draft</p>
        <LegalNotice />

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-semibold text-foreground">1. What Artwall provides</h2>
            <p>
              Artwall lets creators and galleries record a Certificate of
              Authenticity for an artwork, store its image and metadata on IPFS,
              and mint a corresponding ERC-721 token on a supported blockchain.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">2. What a certificate asserts</h2>
            <p>
              A certificate records the information the issuing account entered
              and the on-chain token it is linked to. Artwall does not
              independently verify authorship, provenance, or ownership of the
              physical work, and a certificate is not a legal guarantee of
              authenticity, title, or value.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">3. Your responsibilities</h2>
            <p>
              You warrant that you hold the rights to certify each work you
              submit and that the information you provide is accurate. You are
              responsible for your wallet and its keys. Blockchain transactions
              are irreversible.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">4. Disputes and takedowns</h2>
            <p>
              We will act on well-founded reports of infringing or fraudulent
              certificates, including hiding public verification pages. On-chain
              tokens cannot be deleted; we can correct or annotate metadata.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-foreground">5. Liability</h2>
            <p>
              The service is provided &ldquo;as is&rdquo;. To the extent
              permitted by law, Artwall is not liable for losses arising from
              blockchain networks, IPFS availability, third-party wallets, or the
              accuracy of user-supplied information.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
