let connections: Map<string, EventSource> = new Map();

export const SSEManager = {
    register(id: string, eventSource: EventSource): void {
        this.unregister(id);
        connections.set(id, eventSource);
        console.log(`[SSE] Registered connection: ${id}, total: ${connections.size}`);
    },

    unregister(id: string): void {
        const existing = connections.get(id);
        if (existing) {
            existing.close();
            connections.delete(id);
            console.log(`[SSE] Unregistered connection: ${id}, total: ${connections.size}`);
        }
    },

    closeAll(): void {
        console.log(`[SSE] Closing all ${connections.size} connections`);
        connections.forEach((es, id) => {
            try {
                es.close();
                console.log(`[SSE] Closed connection: ${id}`);
            } catch (e) {
                console.error(`[SSE] Error closing ${id}:`, e);
            }
        });
        connections.clear();
    },

    getCount(): number {
        return connections.size;
    }
};
