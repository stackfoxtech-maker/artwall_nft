import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ipfsToHttp } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { CertificateMintPanel } from "@/components/certificate-mint-panel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CertificateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser(`/certificates/${params.id}`);

  const cert = await prisma.certificate.findUnique({
    where: { id: params.id },
  });
  if (!cert || cert.ownerId !== user.id) notFound();

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify/${cert.id}`;
  const isMinted = cert.status === "MINTED";

  return (
    <>
      <SiteHeader />
      <main className="container grid max-w-4xl gap-6 py-10 md:grid-cols-2">
        <div>
          {cert.imageCid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ipfsToHttp(cert.imageCid)}
              alt={cert.title}
              className="w-full rounded-xl border"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl border text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{cert.title}</h1>
            <p className="text-sm text-muted-foreground">by {cert.creatorName}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-1 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="col-span-2 font-medium">{cert.status}</dd>
                <dt className="text-muted-foreground">Object</dt>
                <dd className="col-span-2">{cert.objectType}</dd>
                <dt className="text-muted-foreground">Medium</dt>
                <dd className="col-span-2">{cert.medium ?? "—"}</dd>
                <dt className="text-muted-foreground">Dimensions</dt>
                <dd className="col-span-2">{cert.dimensions ?? "—"}</dd>
                <dt className="text-muted-foreground">Year</dt>
                <dd className="col-span-2">{cert.year ?? "—"}</dd>
                <dt className="text-muted-foreground">Metadata</dt>
                <dd className="col-span-2 break-all">
                  {cert.metadataUri ? (
                    <a
                      className="underline"
                      href={ipfsToHttp(cert.metadataUri)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {cert.metadataUri}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
                {cert.txHash && (
                  <>
                    <dt className="text-muted-foreground">Tx</dt>
                    <dd className="col-span-2 break-all">{cert.txHash}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isMinted ? "Minted" : "Mint this certificate"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMinted ? (
                <p className="text-sm text-muted-foreground">
                  This certificate is on-chain. Share the public verification
                  link:{" "}
                  <Link className="underline" href={`/verify/${cert.id}`}>
                    {verifyUrl || `/verify/${cert.id}`}
                  </Link>
                </p>
              ) : cert.metadataUri ? (
                <CertificateMintPanel
                  certificateId={cert.id}
                  metadataUri={cert.metadataUri}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Metadata is not pinned yet — finish the wizard first.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
