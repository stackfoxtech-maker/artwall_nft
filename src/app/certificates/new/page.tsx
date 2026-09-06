import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { CoaWizard } from "@/components/wizard/coa-wizard";

export const dynamic = "force-dynamic";

export default async function NewCertificatePage() {
  await requireUser("/certificates/new");

  return (
    <>
      <SiteHeader />
      <main className="container max-w-2xl py-10">
        <h1 className="mb-6 text-2xl font-bold">
          Create a Certificate of Authenticity
        </h1>
        <CoaWizard />
      </main>
    </>
  );
}
