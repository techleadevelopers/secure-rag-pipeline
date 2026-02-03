import { z } from "zod";
import { insertUserSchema, askPayloadSchema, askResponseSchema } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Required system routes
  users: {
    create: {
      method: "POST" as const,
      path: "/api/users",
      input: insertUserSchema,
      responses: {
        201: insertUserSchema,
        400: errorSchemas.validation,
      },
    },
  },
  // Definitions for the external RAG API (for type inference mostly)
  rag: {
    ask: {
      method: "POST" as const,
      path: "/ask", // Note: This will be hit on the external baseURL
      input: askPayloadSchema,
      responses: {
        200: askResponseSchema,
        401: z.object({ detail: z.string() }),
        503: z.object({ detail: z.string() }),
      },
    },
    ingest: {
      method: "POST" as const,
      path: "/ingest",
      responses: {
        200: z.object({ status: z.string() }),
        401: z.object({ detail: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
