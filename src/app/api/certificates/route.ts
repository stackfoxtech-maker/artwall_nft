import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { pinata, type NftMetadata } from "@/lib/pinata";
import { createClient } from "@/lib/supabase/server";
import { apiError, handleRouteError } from "@/lib/http";
import { log, requestId } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  defineSchema,
  createSchema,
  enhanceSchema,
} from "@/components/wizard/types";

export const runtime = "nodejs";

const bodySchema = defineSchema.merge(createSchema).merge(enhanceSchema);

export async function POST(req: NextRequest) {
  const reqId = requestId();
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("unauthenticated", { reqId });

    const rl = await checkRateLimit(`cert-create:${user.id}`, {
      limit: 60,
      windowSec: 3600,
    });
    if (!rl.ok) return apiError("rate_limited", { reqId });

    const input = bodySchema.parse(await req.json());

    await prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email ?? null },
      update: {},
    });

    // 1. Create the record so we have a stable id for the verification URL.
    const cert = await prisma.certificate.create({
      data: {
        status: "DRAFT",
        creatorName: input.creatorName,
        privacy: input.privacy,
        objectType: input.objectType,
        title: input.title,
        medium: input.medium,
        dimensions: input.dimensions,
        year: input.year,
        editionInfo: input.editionInfo,
        imageCid: input.imageCid,
        privateNote: input.privateNote,
        unlockableReward: input.unlockableReward,
        physicalLinkId: input.physicalLinkId || null,
        ownerId: user.id,
      },
    });

    // 2. Build + pin the ERC-721 metadata, now with a real external_url.
    const metadata: NftMetadata = {
      name: input.title,
      description: `Certificate of Authenticity for "${input.title}" by ${input.creatorName}.`,
      image: `ipfs://${input.imageCid}`,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${cert.id}`,
      attributes: [
        { trait_type: "Creator", value: input.creatorName },
        { trait_type: "Object type", value: input.objectType },
        ...(input.medium ? [{ trait_type: "Medium", value: input.medium }] : []),
        ...(input.dimensions
          ? [{ trait_type: "Dimensions", value: input.dimensions }]
          : []),
        ...(input.year ? [{ trait_type: "Year", value: input.year }] : []),
      ],
    };

    const canonical = JSON.stringify(metadata);
    const metadataSha256 = createHash("sha256").update(canonical).digest("hex");
    const pinned = await pinata.upload.public.json(metadata);

    const updated = await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        status: "METADATA_PINNED",
        metadataCid: pinned.cid,
        metadataUri: `ipfs://${pinned.cid}`,
        metadataSha256,
      },
    });

    log.info("certificate created", {
      reqId,
      userId: user.id,
      certId: cert.id,
      metadataCid: pinned.cid,
    });

    return NextResponse.json({
      id: updated.id,
      metadataUri: updated.metadataUri,
    });
  } catch (err) {
    return handleRouteError(err, { route: "POST /api/certificates", reqId });
  }
}
