import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthPanel } from "./auth-panel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next ?? "/dashboard";
  if (await getCurrentUser()) redirect(next);

  return (
    <main className="container flex min-h-screen max-w-md flex-col justify-center py-10">
      <Link href="/" className="mb-6 text-lg font-semibold">
        Artwall 3.0
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthPanel next={next} />
        </CardContent>
      </Card>
    </main>
  );
}
