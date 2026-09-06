import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/** Returns the current Supabase user, or null. */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Requires an authenticated user and guarantees a matching `public."User"` row
 * exists (in case the Supabase auth trigger has not been installed). Redirects
 * to /login otherwise.
 */
export async function requireUser(next = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email ?? null },
    update: { email: user.email ?? null },
  });

  return user;
}
