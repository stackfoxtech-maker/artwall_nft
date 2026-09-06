import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ipfsToHttp } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");

  const certificates = await prisma.certificate.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <SiteHeader />
      <main className="container py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your certificates</h1>
            <p className="text-sm text-muted-foreground">
              Manage collections, minting status, and public verification links.
            </p>
          </div>
          <Link href="/certificates/new">
            <Button>New certificate</Button>
          </Link>
        </div>

        {certificates.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No certificates yet</CardTitle>
              <CardDescription>
                Start the 3-step wizard to create your first Certificate of
                Authenticity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/certificates/new">
                <Button variant="outline">Start the wizard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((c) => (
              <Link key={c.id} href={`/certificates/${c.id}`}>
                <Card className="h-full transition-colors hover:border-foreground/30">
                  {c.imageCid && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ipfsToHttp(c.imageCid)}
                      alt={c.title}
                      className="aspect-square w-full rounded-t-xl object-cover"
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="truncate">{c.title}</CardTitle>
                    <CardDescription>
                      {c.status}
                      {c.tokenId ? ` · #${c.tokenId}` : ""}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
