// Server-Sent Events manager for real-time session notifications

type SSEClient = {
  userId: number;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

class SessionEventManager {
  private clients: Map<string, SSEClient> = new Map();

  addClient(clientId: string, userId: number, controller: ReadableStreamDefaultController<Uint8Array>) {
    this.clients.set(clientId, { userId, controller });
    console.log(`SSE client connected: ${clientId} for user ${userId}`);
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId);
    console.log(`SSE client disconnected: ${clientId}`);
  }

  notifySessionTerminated(userId: number, reason: string = 'new_login') {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify({ type: 'session_terminated', reason })}\n\n`;
    
    let notifiedCount = 0;
    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId) {
        try {
          client.controller.enqueue(encoder.encode(message));
          notifiedCount++;
        } catch (e) {
          this.removeClient(clientId);
        }
      }
    }
    
    console.log(`Notified ${notifiedCount} SSE clients of session termination for user ${userId}`);
    return notifiedCount;
  }

  getClientCount(userId?: number): number {
    if (userId === undefined) {
      return this.clients.size;
    }
    return Array.from(this.clients.values()).filter(c => c.userId === userId).length;
  }
}

export const sessionEvents = new SessionEventManager();
