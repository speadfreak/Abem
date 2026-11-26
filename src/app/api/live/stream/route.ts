import { buildLiveSnapshot } from "@/lib/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* Server-Sent Events stream: live orders + service requests, every 2.5s. */
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* client gone */
        }
      };

      const push = async () => {
        try {
          const snap = await buildLiveSnapshot();
          send("snapshot", snap);
        } catch (e) {
          console.error("[sse]", e);
        }
      };

      await push();
      interval = setInterval(push, 2500);

      const heartbeat = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            /* noop */
          }
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        if (interval) clearInterval(interval);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* noop */
        }
      });
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
