import { z } from 'zod';

// Vision Schema for Multi-modal support
const MessagePartSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ 
    type: z.literal("image_url"), 
    image_url: z.object({ url: z.string() }) 
  })
]);

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
        // CHANGE: message now accepts string OR the Vision Array
        message: z.union([z.string(), z.array(MessagePartSchema)]),
        liveOnly: z.boolean().default(true),
        model: z.string().optional(),
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
