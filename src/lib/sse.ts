/**
 * Server-Sent Events manager.
 * Allows dashboard pages to receive real-time updates.
 */

export type SSEEvent = {
  type: "notification" | "audit" | "activity" | "stats";
  data: unknown;
};

type SSEListener = (event: SSEEvent) => void;

const listeners: Set<SSEListener> = new Set();

export function subscribeSSE(listener: SSEListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSSE(event: SSEEvent): void {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // listener disconnected
    }
  });
}
