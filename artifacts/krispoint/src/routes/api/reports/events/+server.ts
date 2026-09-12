import type { RequestHandler } from './$types';
import { validateSessionFromRequest } from '$lib/server/auth';
import { reportEvents } from '$lib/server/reportEvents';

export const GET: RequestHandler = async ({ request }) => {
  const session = await validateSessionFromRequest(request);
  
  if (!session.success || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const clientId = `report-${session.user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      reportEvents.addClient(clientId, controller);
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`));
      
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
          reportEvents.removeClient(clientId);
        }
      }, 30000);
    },
    cancel() {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      reportEvents.removeClient(clientId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
};
