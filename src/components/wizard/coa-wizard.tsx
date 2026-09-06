"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WizardData } from "./types";

const STEPS = ["Define", "Create", "Enhance"] as const;

export function CoaWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    privacy: "PUBLIC",
    objectType: "PHYSICAL_ARTWORK",
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const set = (patch: Partial<WizardData>) =>
    setData((d) => ({ ...d, ...patch }));

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ipfs/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { cid: string };
      set({ imageCid: json.cid });
    } catch (e) {
      alert(`Upload failed: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 401) {
        window.location.href = "/login?next=/certificates/new";
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { id: string; metadataUri: string };
      setResult("Draft saved — taking you to the mint step…");
      router.push(`/certificates/${json.id}`);
    } catch (e) {
      alert(`Save failed: ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2 text-sm">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={
                i === step
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <CardTitle>Step {step + 1}: {STEPS[step]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 && (
          <>
            <Field label="Creator name">
              <Input
                value={data.creatorName ?? ""}
                onChange={(e) => set({ creatorName: e.target.value })}
              />
            </Field>
            <Field label="Privacy">
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={data.privacy}
                onChange={(e) =>
                  set({ privacy: e.target.value as WizardData["privacy"] })
                }
              >
                <option value="PUBLIC">Public</option>
                <option value="UNLISTED">Unlisted</option>
                <option value="PRIVATE">Private</option>
              </select>
            </Field>
            <Field label="Object type">
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={data.objectType}
                onChange={(e) =>
                  set({
                    objectType: e.target.value as WizardData["objectType"],
                  })
                }
              >
                <option value="PHYSICAL_ARTWORK">Physical artwork</option>
                <option value="DIGITAL_ARTWORK">Digital artwork</option>
                <option value="EDITION">Edition</option>
                <option value="PHOTOGRAPH">Photograph</option>
                <option value="SCULPTURE">Sculpture</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Artwork file">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />
              {uploading && (
                <p className="text-xs text-muted-foreground">
                  Pinning to IPFS…
                </p>
              )}
              {data.imageCid && (
                <p className="text-xs text-green-600">
                  Pinned: {data.imageCid}
                </p>
              )}
            </Field>
            <Field label="Title">
              <Input
                value={data.title ?? ""}
                onChange={(e) => set({ title: e.target.value })}
              />
            </Field>
            <Field label="Medium">
              <Input
                value={data.medium ?? ""}
                onChange={(e) => set({ medium: e.target.value })}
              />
            </Field>
            <Field label="Dimensions">
              <Input
                value={data.dimensions ?? ""}
                onChange={(e) => set({ dimensions: e.target.value })}
              />
            </Field>
            <Field label="Year">
              <Input
                type="number"
                value={data.year ?? ""}
                onChange={(e) => set({ year: Number(e.target.value) })}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Private note (not published on-chain)">
              <Textarea
                value={data.privateNote ?? ""}
                onChange={(e) => set({ privateNote: e.target.value })}
              />
            </Field>
            <Field label="Unlockable reward">
              <Input
                value={data.unlockableReward ?? ""}
                onChange={(e) => set({ unlockableReward: e.target.value })}
              />
            </Field>
            <Field label="Physical link ID (QR / NFC token)">
              <Input
                value={data.physicalLinkId ?? ""}
                onChange={(e) => set({ physicalLinkId: e.target.value })}
              />
            </Field>
          </>
        )}

        {result && (
          <p className="rounded-md bg-muted p-3 text-sm">{result}</p>
        )}

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : "Save draft & generate metadata"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
