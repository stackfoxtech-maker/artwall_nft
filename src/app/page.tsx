import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="container flex h-16 items-center justify-between">
        <span className="text-lg font-semibold">Artwall 3.0</span>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <WalletConnectButton />
        </div>
      </header>

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
