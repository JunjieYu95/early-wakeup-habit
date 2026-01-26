import { z } from "zod";

export const DateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export const RecordUpsertSchema = z.object({
  date: DateKey,
  checked: z.boolean().optional().default(false),
  imageUrl: z.string().url().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  utcOffsetMinutes: z.number().int().min(-720).max(840).optional().nullable()
});

export const RecordPatchSchema = z.object({
  checked: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  utcOffsetMinutes: z.number().int().min(-720).max(840).optional().nullable()
});

export const RangeQuerySchema = z.object({
  from: DateKey.optional(),
  to: DateKey.optional()
});

// Check-in schemas (accepts "message" as alias for "note")
export const CheckInSchema = z.object({
  date: DateKey,
  checked: z.boolean().optional().default(true),
  message: z.string().max(500).optional().nullable(),
  note: z.string().max(500).optional().nullable(), // Also accept note for compatibility
  imageUrl: z.string().url().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  utcOffsetMinutes: z.number().int().min(-720).max(840).optional().nullable()
}).transform((data) => {
  // Use message if provided, otherwise use note
  return {
    ...data,
    note: data.message ?? data.note ?? null
  };
});

export const CheckInBatchSchema = z.object({
  checkins: z.array(CheckInSchema).min(1).max(100) // Limit batch size
});

export const CheckInRequestSchema = z.union([
  CheckInSchema, // Single check-in
  CheckInBatchSchema // Batch check-ins
]);
