import { CoaWizard } from "@/components/wizard/coa-wizard";

export default function NewCertificatePage() {
  return (
    <main className="container max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-bold">Create a Certificate of Authenticity</h1>
      <CoaWizard />
    </main>
  );
}
