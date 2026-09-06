import { NextRequest, NextResponse } from "next/server";
import { pinata } from "@/lib/pinata";
import { createClient } from "@/lib/supabase/server";
import { apiError, handleRouteError } from "@/lib/http";
import { log, requestId } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
  "image/avif",
]);

export async function POST(req: NextRequest) {
  const reqId = requestId();
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("unauthenticated", { reqId });

    const rl = await checkRateLimit(`upload:${user.id}`, { limit: 20, windowSec: 3600 });
    if (!rl.ok) return apiError("rate_limited", { reqId });

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError("validation_failed", { reqId, details: "No file provided" });
    }
    if (file.size > MAX_BYTES) return apiError("payload_too_large", { reqId });
    if (!ALLOWED_TYPES.has(file.type)) {
      return apiError("unsupported_media_type", { reqId });
    }

    const upload = await pinata.upload.public.file(file);
    log.info("ipfs upload", { reqId, userId: user.id, cid: upload.cid, bytes: file.size });
    return NextResponse.json({ cid: upload.cid });
  } catch (err) {
    return handleRouteError(err, { route: "POST /api/ipfs/upload", reqId });
  }
}
