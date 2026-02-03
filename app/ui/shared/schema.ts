import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === External API Types ===

export const citationSchema = z.object({
  doc_id: z.string(),
  source: z.string(),
  loc: z.string().optional(),
  quote: z.string(),
});

export const metricsSchema = z.object({
  latency_ms: z.number(),
  tokens_est: z.number(),
  cost_est: z.number(),
  topk: z.number(),
  docs_used: z.number(),
});

export const askResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(citationSchema),
  confidence: z.number(),
  notes: z.array(z.string()).default([]),
  metrics: metricsSchema,
});

export const askPayloadSchema = z.object({
  question: z.string(),
  user_role: z.enum(["public", "internal", "restricted"]),
  conversation_id: z.string().optional(),
});

export type AskResponse = z.infer<typeof askResponseSchema>;
export type AskPayload = z.infer<typeof askPayloadSchema>;
export type Citation = z.infer<typeof citationSchema>;
export type Metrics = z.infer<typeof metricsSchema>;

// === Local App Schema (Required for system structure) ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
