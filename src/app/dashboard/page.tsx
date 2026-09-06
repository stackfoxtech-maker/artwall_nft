import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// TODO: replace with a Supabase-authed server fetch:
//   const supabase = createClient();
//   const { data: { user } } = await supabase.auth.getUser();
//   const certificates = await prisma.certificate.findMany({ where: { ownerId: user.id } });
const certificates: {
  id: string;
  title: string;
  status: string;
  tokenId: string | null;
}[] = [];

export default function DashboardPage() {
  return (
    <main className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your certificates</h1>
          <p className="text-sm text-muted-foreground">
            Manage collections, minting status, and public verification links.
          </p>
        </div>
        <Link href="/certificates/new">
          <Button>New certificate</Button>
        </Link>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No certificates yet</CardTitle>
            <CardDescription>
              Start the 3-step wizard to create your first Certificate of
              Authenticity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/certificates/new">
              <Button variant="outline">Start the wizard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>
                  {c.status}
                  {c.tokenId ? ` · #${c.tokenId}` : ""}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
