import { z } from "zod";

export const cadObjectKindSchema = z.enum(["line", "block", "circle", "polyline", "text", "unknown"]);

export const point3dSchema = z.object({
  x: z.number().describe("X coordinate"),
  y: z.number().describe("Y coordinate"),
  z: z.number().default(0).describe("Z coordinate"),
});

export const addLineSchema = z.object({
  start: point3dSchema,
  end: point3dSchema,
  layer: z.string().optional(),
});

export const insertBlockSchema = z.object({
  name: z.string().min(1),
  insertionPoint: point3dSchema,
  scale: point3dSchema.optional(),
  rotation: z.number().default(0),
  layer: z.string().optional(),
});

export const listObjectsSchema = z.object({
  kind: cadObjectKindSchema.optional(),
  layer: z.string().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const analyzeDrawingSchema = z.object({});

export const resolveOverlapsSchema = z.object({
  spacing: z.number().positive().default(10),
  apply: z.boolean().default(false).describe("trueの場合は移動を実行し、falseの場合は移動案のみ返します"),
});

export type AddLineInput = z.infer<typeof addLineSchema>;
export type InsertBlockInput = z.infer<typeof insertBlockSchema>;
export type ListObjectsInput = z.infer<typeof listObjectsSchema>;
export type AnalyzeDrawingInput = z.infer<typeof analyzeDrawingSchema>;
export type ResolveOverlapsInput = z.infer<typeof resolveOverlapsSchema>;
