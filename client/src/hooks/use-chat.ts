import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type ChatResponse } from "@shared/routes";
import { z } from "zod";

// Fetch system status
export function useSystemStatus() {
  return useQuery({
    queryKey: [api.chat.status.path],
    queryFn: async () => {
      const res = await fetch(api.chat.status.path);
      if (!res.ok) throw new Error("Failed to fetch status");
      return api.chat.status.responses[200].parse(await res.json());
    },
    refetchInterval: 30000, // Check every 30s
  });
}

// Send chat message
type SendMessageInput = z.infer<typeof api.chat.send.input>;

export function useSendMessage() {
  return useMutation({
    mutationFn: async (data: SendMessageInput) => {
      const res = await fetch(api.chat.send.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        // Try to parse structured error
        let bodyText = undefined;
        try {
          // Prefer structured JSON error when available
          const errorData = await res.json();
          bodyText = errorData.message || JSON.stringify(errorData);
        } catch (_) {
          // Fallback to plain text body
          try {
            bodyText = await res.text();
          } catch (__) {
            bodyText = undefined;
          }
        }

        const msg = bodyText || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      return api.chat.send.responses[200].parse(await res.json());
    },
  });
}
