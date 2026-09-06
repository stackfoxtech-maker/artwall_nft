import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ipfsToHttp, shortAddress } from "@/lib/utils";
import { checkOnChain } from "@/lib/verify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 60;

export default async function VerifyPage({
  params,
}: {
  params: { id: string };
}) {
  const cert = await prisma.certificate.findFirst({
    where: {
      OR: [{ id: params.id }, { physicalLinkId: params.id }],
      privacy: { not: "PRIVATE" },
    },
  });

  if (!cert) notFound();

  const chain = cert.status === "MINTED" ? await checkOnChain(cert) : null;

  return (
    <>
      <SiteHeader />
      <main className="container max-w-xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>{cert.title}</CardTitle>
            <p className="text-sm text-muted-foreground">by {cert.creatorName}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {cert.imageCid && (
              <Image
                src={ipfsToHttp(cert.imageCid)}
                alt={cert.title}
                width={600}
                height={600}
                className="rounded-lg border"
              />
            )}

            {chain?.reachable ? (
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium text-green-600">✓ Verified on-chain</p>
                <dl className="mt-2 grid grid-cols-3 gap-1">
                  <dt className="text-muted-foreground">Token</dt>
                  <dd className="col-span-2">
                    #{cert.tokenId} · {shortAddress(cert.contractAddr)}
                  </dd>
                  <dt className="text-muted-foreground">Current owner</dt>
                  <dd className="col-span-2 break-all">{chain.owner}</dd>
                  <dt className="text-muted-foreground">Metadata URI</dt>
                  <dd className="col-span-2">
                    {chain.uriMatches
                      ? "matches the issued record"
                      : "differs from the issued record"}
                  </dd>
                  {chain.metadataHashMatches === true && (
                    <>
                      <dt className="text-muted-foreground">Content</dt>
                      <dd className="col-span-2">
                        hash matches the certificate at issue
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            ) : cert.status === "MINTED" ? (
              <p className="rounded-md border p-3 text-sm text-muted-foreground">
                On-chain check unavailable right now — showing the recorded
                certificate.
              </p>
            ) : null}

            <dl className="grid grid-cols-3 gap-1 text-sm">
              <dt className="text-muted-foreground">Medium</dt>
              <dd className="col-span-2">{cert.medium ?? "—"}</dd>
              <dt className="text-muted-foreground">Dimensions</dt>
              <dd className="col-span-2">{cert.dimensions ?? "—"}</dd>
              <dt className="text-muted-foreground">Year</dt>
              <dd className="col-span-2">{cert.year ?? "—"}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="col-span-2">{cert.status}</dd>
              {cert.txHash && (
                <>
                  <dt className="text-muted-foreground">Transaction</dt>
                  <dd className="col-span-2 break-all">{cert.txHash}</dd>
                </>
              )}
              {cert.metadataUri && (
                <>
                  <dt className="text-muted-foreground">Metadata</dt>
                  <dd className="col-span-2 break-all">
                    <a
                      className="underline"
                      href={ipfsToHttp(cert.metadataUri)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {cert.metadataUri}
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
