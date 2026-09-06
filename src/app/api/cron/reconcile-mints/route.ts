import { NextRequest, NextResponse } from "next/server";
import type { Hex } from "viem";
import { prisma } from "@/lib/prisma";
import { verifyMintTx } from "@/lib/chain";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sweeps certificates stuck in MINTING (client closed the tab, poll never
// finished) and resolves them from the chain. Wired to a Vercel Cron in
// vercel.json; protect with CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const stale = await prisma.certificate.findMany({
    where: {
      status: "MINTING",
      txHash: { not: null },
      mintRequestedAt: { lt: new Date(Date.now() - 2 * 60 * 1000) },
    },
    take: 50,
  });

  let minted = 0;
  let failed = 0;
  let pending = 0;

  for (const cert of stale) {
    try {
      const verdict = await verifyMintTx(
        cert.txHash as Hex,
        cert.chainId ?? undefined,
      );
      if (verdict.state === "pending") {
        pending++;
        continue;
      }
      if (verdict.state === "failed") {
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { status: "FAILED", mintError: verdict.reason },
        });
        failed++;
      } else {
        await prisma.certificate.update({
          where: { id: cert.id },
          data: {
            status: "MINTED",
            tokenId: verdict.tokenId,
            contractAddr: verdict.contractAddr,
            chainId: verdict.chainId,
            mintedAt: new Date(),
          },
        });
        minted++;
      }
    } catch (err) {
      log.error("reconcile error", {
        certId: cert.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.info("mint reconcile sweep", { scanned: stale.length, minted, failed, pending });
  return NextResponse.json({ scanned: stale.length, minted, failed, pending });
}
