import { Providers } from "@/app/providers";

// Wallet / wagmi context is only loaded for the certificate routes that mint.
// Keeps the ~300 kB web3 bundle off the landing, auth, dashboard, and verify pages.
export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
