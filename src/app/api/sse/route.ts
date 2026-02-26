import { subscribeSSE, emitSSE } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      // Subscribe to events
      const unsubscribe = subscribeSSE((event) => {
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          unsubscribe();
        }
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      // Simulate periodic activity events for demo
      const demo = setInterval(() => {
        const activities = [
          { actor: "qyburn-bot", action: "kb.query", target: "VPN Setup" },
          { actor: "erik.svensson@saga.com", action: "license.assign", target: "JetBrains" },
          { actor: "qyburn-bot", action: "group.approve", target: "SG-VPN-Users" },
        ];
        const activity = activities[Math.floor(Math.random() * activities.length)];
        emitSSE({
          type: "activity",
          data: { ...activity, timestamp: new Date().toISOString() },
        });
      }, 45000);

      // Cleanup on close
      const cleanup = () => {
        clearInterval(heartbeat);
        clearInterval(demo);
        unsubscribe();
      };

      // Store cleanup for when stream is cancelled
      (controller as unknown as { _cleanup?: () => void })._cleanup = cleanup;
    },
    cancel(controller) {
      const ctrl = controller as unknown as { _cleanup?: () => void };
      ctrl._cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
