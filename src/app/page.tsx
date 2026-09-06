import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="container flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Blockchain-backed Certificates of Authenticity for physical &amp;
          digital art
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Issue a Certificate of Authenticity in three steps, pin the artwork and
          metadata to IPFS, then mint an ERC-721 with on-chain royalties.
        </p>
        <div className="flex gap-3">
          <Link href="/certificates/new">
            <Button size="lg">Create a certificate</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              View dashboard
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
