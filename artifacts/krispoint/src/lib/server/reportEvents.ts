type SSEClient = {
  controller: ReadableStreamDefaultController<Uint8Array>;
};

class ReportEventManager {
  private clients: Map<string, SSEClient> = new Map();

  addClient(clientId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
    this.clients.set(clientId, { controller });
    console.log(`Report SSE client connected: ${clientId}, total: ${this.clients.size}`);
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId);
    console.log(`Report SSE client disconnected: ${clientId}, total: ${this.clients.size}`);
  }

  notifyReportStatusChange(reportId: number, worklistId: number | null, newStatus: string, reportStatus: string) {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify({ 
      type: 'report_status_changed', 
      reportId,
      worklistId,
      newStatus,
      reportStatus,
      timestamp: Date.now()
    })}\n\n`;
    
    let notifiedCount = 0;
    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.controller.enqueue(encoder.encode(message));
        notifiedCount++;
      } catch (e) {
        this.removeClient(clientId);
      }
    }
    
    if (notifiedCount > 0) {
      console.log(`Notified ${notifiedCount} SSE clients of report status change: report ${reportId} -> ${reportStatus}`);
    }
    return notifiedCount;
  }

  notifyWorklistUpdate(worklistId: number, updates: Record<string, any>) {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify({ 
      type: 'worklist_updated', 
      worklistId,
      updates,
      timestamp: Date.now()
    })}\n\n`;
    
    let notifiedCount = 0;
    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.controller.enqueue(encoder.encode(message));
        notifiedCount++;
      } catch (e) {
        this.removeClient(clientId);
      }
    }
    
    return notifiedCount;
  }

  notifyReportClaimed(reportId: number, newSpecialistId: number, previousSpecialistId: number | null) {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify({ 
      type: 'report_claimed', 
      reportId,
      newSpecialistId,
      previousSpecialistId,
      timestamp: Date.now()
    })}\n\n`;
    
    let notifiedCount = 0;
    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.controller.enqueue(encoder.encode(message));
        notifiedCount++;
      } catch (e) {
        this.removeClient(clientId);
      }
    }
    
    if (notifiedCount > 0) {
      console.log(`Notified ${notifiedCount} SSE clients of report claim: report ${reportId} claimed by ${newSpecialistId}`);
    }
    return notifiedCount;
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const reportEvents = new ReportEventManager();
