import { z } from "zod";

export const defineSchema = z.object({
  creatorName: z.string().min(1, "Creator is required"),
  privacy: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
  objectType: z.enum([
    "PHYSICAL_ARTWORK",
    "DIGITAL_ARTWORK",
    "EDITION",
    "PHOTOGRAPH",
    "SCULPTURE",
    "OTHER",
  ]),
});

export const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  medium: z.string().optional(),
  dimensions: z.string().optional(),
  year: z.coerce.number().int().optional(),
  editionInfo: z.string().optional(),
  imageCid: z.string().min(1, "Upload the artwork first"),
});

export const enhanceSchema = z.object({
  privateNote: z.string().optional(),
  unlockableReward: z.string().optional(),
  physicalLinkId: z.string().optional(),
});

export type DefineData = z.infer<typeof defineSchema>;
export type CreateData = z.infer<typeof createSchema>;
export type EnhanceData = z.infer<typeof enhanceSchema>;

export type WizardData = Partial<DefineData & CreateData & EnhanceData>;
