import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const patchSchema = z.object({
  txHash: z.string().min(1),
  chainId: z.number().int().optional(),
  contractAddr: z.string().optional(),
  tokenId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existing = await prisma.certificate.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });
  if (!existing || existing.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let input: z.infer<typeof patchSchema>;
  try {
    input = patchSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: (err as z.ZodError).flatten() },
      { status: 422 },
    );
  }

  const cert = await prisma.certificate.update({
    where: { id: params.id },
    data: {
      status: "MINTED",
      txHash: input.txHash,
      chainId: input.chainId,
      contractAddr: input.contractAddr,
      tokenId: input.tokenId,
      mintedAt: new Date(),
    },
  });

  return NextResponse.json({ id: cert.id, status: cert.status });
}
