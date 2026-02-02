import { z } from 'zod';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  chat: {
    send: {
      method: 'POST' as const,
      path: '/api/chat',
      input: z.object({
        message: z.string(),
        liveOnly: z.boolean().default(true),
        model: z.string().optional(), // kept for compatibility/logging
      }),
      responses: {
        200: z.object({
          response: z.string(),
          isFallback: z.boolean(),
          note: z.string().optional(),
        }),
        500: errorSchemas.internal,
      },
    },
    status: {
      method: 'GET' as const,
      path: '/api/status',
      responses: {
        200: z.object({
          gemini: z.boolean(),
          live: z.boolean(),
        }),
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

export type ChatResponse = z.infer<typeof api.chat.send.responses[200]>;
