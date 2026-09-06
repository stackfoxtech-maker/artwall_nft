import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Artwall</span>
        <nav className="flex gap-4">
          <Link href="/legal/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
