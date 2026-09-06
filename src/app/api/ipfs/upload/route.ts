import { NextRequest, NextResponse } from "next/server";
import { pinata } from "@/lib/pinata";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const upload = await pinata.upload.public.file(file);
    return NextResponse.json({ cid: upload.cid });
  } catch (err) {
    console.error("[ipfs/upload]", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
