import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { apiError, handleRouteError } from "@/lib/http";
import { requestId, log } from "@/lib/logger";
import { DEFAULT_CHAIN_ID, NFT_CONTRACT_ADDRESS } from "@/lib/chain";

export const runtime = "nodejs";

// The client may ONLY report that a mint transaction was broadcast. It can never
// set MINTED — that is the confirm route's job, driven by the on-chain receipt.
const patchSchema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "not a transaction hash"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = requestId();
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("unauthenticated", { reqId });

    const existing = await prisma.certificate.findUnique({
      where: { id: params.id },
      select: { ownerId: true, status: true },
    });
    if (!existing || existing.ownerId !== user.id) {
      return apiError("not_found", { reqId });
    }
    if (existing.status !== "METADATA_PINNED" && existing.status !== "MINTING") {
      return apiError("conflict", {
        reqId,
        details: `cannot start a mint from status ${existing.status}`,
      });
    }

    const { txHash } = patchSchema.parse(await req.json());

    const cert = await prisma.certificate.update({
      where: { id: params.id },
      data: {
        status: "MINTING",
        txHash: txHash.toLowerCase(),
        chainId: DEFAULT_CHAIN_ID,
        contractAddr: NFT_CONTRACT_ADDRESS,
        mintRequestedAt: new Date(),
        mintError: null,
      },
    });

    log.info("mint reported", { reqId, certId: cert.id, txHash });
    return NextResponse.json({ id: cert.id, status: cert.status });
  } catch (err) {
    return handleRouteError(err, {
      route: "PATCH /api/certificates/[id]",
      reqId,
    });
  }
}
