import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          Artwall 3.0
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <WalletConnectButton />
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button>Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
