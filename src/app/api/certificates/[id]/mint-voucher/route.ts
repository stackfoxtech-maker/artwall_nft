import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAddress, getAddress } from "viem";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { apiError, handleRouteError } from "@/lib/http";
import { requestId, log } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { newVoucherNonce, signMintVoucher } from "@/lib/mint-voucher";

export const runtime = "nodejs";

const bodySchema = z.object({
  to: z.string().refine(isAddress, "invalid address"),
  royaltyReceiver: z.string().refine(isAddress, "invalid address"),
  royaltyFeeBps: z.number().int().min(0).max(10_000),
});

// Issues a platform-signed EIP-712 voucher that authorizes minting THIS
// certificate. The nonce is persisted so a voucher can't be minted twice or
// re-issued for an already-minted cert.
export async function POST(
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

    const rl = await checkRateLimit(`voucher:${user.id}`, {
      limit: 30,
      windowSec: 3600,
    });
    if (!rl.ok) return apiError("rate_limited", { reqId });

    const cert = await prisma.certificate.findUnique({ where: { id: params.id } });
    if (!cert || cert.ownerId !== user.id) return apiError("not_found", { reqId });
    if (!cert.metadataUri) {
      return apiError("conflict", { reqId, details: "metadata not pinned yet" });
    }
    if (cert.status === "MINTED") {
      return apiError("conflict", { reqId, details: "already minted" });
    }

    const { to, royaltyReceiver, royaltyFeeBps } = bodySchema.parse(
      await req.json(),
    );

    const nonce = newVoucherNonce();
    const deadline = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutes

    const { voucher, signature } = await signMintVoucher({
      to: getAddress(to),
      uri: cert.metadataUri,
      royaltyReceiver: getAddress(royaltyReceiver),
      royaltyFeeBps,
      nonce,
      deadline,
    });

    await prisma.certificate.update({
      where: { id: cert.id },
      data: { mintNonce: nonce, status: "METADATA_PINNED", mintError: null },
    });

    log.info("mint voucher issued", { reqId, certId: cert.id });
    return NextResponse.json({
      voucher: {
        ...voucher,
        royaltyFeeBps: voucher.royaltyFeeBps,
        deadline: voucher.deadline,
      },
      signature,
    });
  } catch (err) {
    return handleRouteError(err, {
      route: "POST /api/certificates/[id]/mint-voucher",
      reqId,
    });
  }
}
