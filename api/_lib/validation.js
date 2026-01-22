import { z } from "zod";

export const DateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export const RecordUpsertSchema = z.object({
  date: DateKey,
  checked: z.boolean().optional().default(false),
  imageUrl: z.string().url().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable()
});

export const RecordPatchSchema = z.object({
  checked: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable()
});

export const RangeQuerySchema = z.object({
  from: DateKey.optional(),
  to: DateKey.optional()
});
