import { NextRequest, NextResponse } from "next/server";
import type { Hex } from "viem";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { apiError, handleRouteError } from "@/lib/http";
import { requestId, log } from "@/lib/logger";
import { verifyMintTx } from "@/lib/chain";

export const runtime = "nodejs";

/**
 * Authoritative mint confirmation. Reads the on-chain receipt + logs and is the
 * ONLY path that may move a certificate to MINTED or FAILED. Safe to call
 * repeatedly (the client polls it; a cron watchdog also calls it — see
 * /api/cron/reconcile-mints).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = requestId();
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("unauthenticated", { reqId });

    const cert = await prisma.certificate.findUnique({ where: { id: params.id } });
    if (!cert || cert.ownerId !== user.id) return apiError("not_found", { reqId });

    if (cert.status === "MINTED" || cert.status === "FAILED") {
      return NextResponse.json({ status: cert.status, tokenId: cert.tokenId });
    }
    if (cert.status !== "MINTING" || !cert.txHash) {
      return apiError("conflict", { reqId, details: "no mint in progress" });
    }

    const verdict = await verifyMintTx(
      cert.txHash as Hex,
      cert.chainId ?? undefined,
    );

    if (verdict.state === "pending") {
      return NextResponse.json({ status: "MINTING" });
    }

    if (verdict.state === "failed") {
      await prisma.certificate.update({
        where: { id: cert.id },
        data: { status: "FAILED", mintError: verdict.reason },
      });
      log.warn("mint failed verification", {
        reqId,
        certId: cert.id,
        reason: verdict.reason,
      });
      return NextResponse.json({ status: "FAILED", error: verdict.reason });
    }

    const done = await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        status: "MINTED",
        tokenId: verdict.tokenId,
        contractAddr: verdict.contractAddr,
        chainId: verdict.chainId,
        mintedAt: new Date(),
        mintError: null,
      },
    });
    log.info("mint confirmed", {
      reqId,
      certId: cert.id,
      tokenId: verdict.tokenId,
    });
    return NextResponse.json({ status: "MINTED", tokenId: done.tokenId });
  } catch (err) {
    return handleRouteError(err, {
      route: "POST /api/certificates/[id]/confirm",
      reqId,
    });
  }
}
