import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { pinata, type NftMetadata } from "@/lib/pinata";
import { createClient } from "@/lib/supabase/server";
import { defineSchema, createSchema, enhanceSchema } from "@/components/wizard/types";

export const runtime = "nodejs";

const bodySchema = defineSchema.merge(createSchema).merge(enhanceSchema);

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const input = bodySchema.parse(await req.json());

    // Ensure the User row exists (mirrors auth.users.id).
    await prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email },
      update: {},
    });

    // Build + pin ERC-721 metadata JSON.
    const metadata: NftMetadata = {
      name: input.title,
      description: `Certificate of Authenticity for "${input.title}" by ${input.creatorName}.`,
      image: `ipfs://${input.imageCid}`,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/PLACEHOLDER`,
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

    const pinned = (await pinata.upload.json(metadata)) as {
      IpfsHash?: string;
      cid?: string;
    };
    const metadataCid = pinned.cid ?? pinned.IpfsHash ?? "";
    const metadataUri = `ipfs://${metadataCid}`;

    const cert = await prisma.certificate.create({
      data: {
        status: "METADATA_PINNED",
        creatorName: input.creatorName,
        privacy: input.privacy,
        objectType: input.objectType,
        title: input.title,
        medium: input.medium,
        dimensions: input.dimensions,
        year: input.year,
        editionInfo: input.editionInfo,
        imageCid: input.imageCid,
        metadataCid,
        metadataUri,
        privateNote: input.privateNote,
        unlockableReward: input.unlockableReward,
        physicalLinkId: input.physicalLinkId || null,
        ownerId: user.id,
      },
    });

    return NextResponse.json({ id: cert.id, metadataUri });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 422 });
    }
    console.error("[certificates]", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
