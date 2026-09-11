import type { RequestHandler } from './$types';
import { validateSession } from '$lib/server/auth';
import { sessionEvents } from '$lib/server/sessionEvents';

export const GET: RequestHandler = async ({ cookies }) => {
  const token = cookies.get('session_token');
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await validateSession(token);
  if (!result.success || !result.user) {
    return new Response('Invalid session', { status: 401 });
  }

  const userId = result.user.id;
  const clientId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      sessionEvents.addClient(clientId, userId, controller);
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
      
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          sessionEvents.removeClient(clientId);
        }
      }, 30000);
    },
    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      sessionEvents.removeClient(clientId);
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
