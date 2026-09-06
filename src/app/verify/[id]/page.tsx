import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ipfsToHttp } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <main className="container max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>{cert.title}</CardTitle>
          <p className="text-sm text-muted-foreground">by {cert.creatorName}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {cert.imageCid && (
            <Image
              src={ipfsToHttp(cert.imageCid)}
              alt={cert.title}
              width={600}
              height={600}
              className="rounded-lg border"
            />
          )}
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
                <dt className="text-muted-foreground">Tx</dt>
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
  );
}
