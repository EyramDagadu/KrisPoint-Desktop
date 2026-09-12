import { writable, derived, get } from 'svelte/store';

export interface ChatUser {
  id: number;
  fullName: string;
  title: string | null;
  roleId: number;
  isOnline: boolean | null;
  lastSeenAt: string | null;
  status: string | null;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  senderName?: string;
  senderTitle?: string;
}

export interface UnreadInfo {
  totalUnread: number;
  unreadBySender: Array<{
    senderId: number;
    senderName: string;
    senderTitle: string | null;
    count: number;
  }>;
}

class ChatService {
  private initialized: boolean = false;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private presenceInterval: ReturnType<typeof setInterval> | null = null;

  public users = writable<ChatUser[]>([]);
  public messages = writable<ChatMessage[]>([]);
  public unreadInfo = writable<UnreadInfo>({ totalUnread: 0, unreadBySender: [] });
  public selectedUserId = writable<number | null>(null);
  public isOpen = writable(false);
  public isLoading = writable(false);

  public totalUnread = derived(this.unreadInfo, $info => $info.totalUnread);

  init() {
    this.initialized = true;
    this.startPolling();
    this.updatePresence(true);
    this.startPresenceHeartbeat();
  }

  destroy() {
    this.stopPolling();
    this.updatePresence(false);
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    this.initialized = false;
  }

  private getFetchOptions(method: string = 'GET', body?: object) {
    const options: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    return options;
  }

  private startPolling() {
    this.fetchUsers();
    this.fetchUnread();
    
    this.pollingInterval = setInterval(() => {
      this.fetchUnread();
      const selectedId = get(this.selectedUserId);
      if (selectedId) {
        this.fetchMessages(selectedId);
      }
    }, 3000);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private startPresenceHeartbeat() {
    this.presenceInterval = setInterval(() => {
      this.updatePresence(true);
      this.fetchUsers();
    }, 30000);
  }

  async fetchUsers() {
    if (!this.initialized) return;
    
    try {
      const res = await fetch('/api/chat/users', this.getFetchOptions());
      
      if (res.ok) {
        const data = await res.json();
        this.users.set(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch chat users:', error);
    }
  }

  async fetchMessages(userId: number) {
    if (!this.initialized) return;
    
    try {
      const res = await fetch(`/api/chat/messages/${userId}`, this.getFetchOptions());
      
      if (res.ok) {
        const data = await res.json();
        this.messages.set(data.messages || []);
        // Wait a moment for database to commit, then refresh unread count
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.fetchUnread();
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }

  async fetchUnread() {
    if (!this.initialized) return;
    
    try {
      const res = await fetch('/api/chat/unread', this.getFetchOptions());
      
      if (res.ok) {
        const data = await res.json();
        this.unreadInfo.set(data);
      }
    } catch (error) {
      console.error('Failed to fetch unread:', error);
    }
  }

  async sendMessage(receiverId: number, content: string): Promise<boolean> {
    if (!this.initialized || !content.trim()) return false;
    
    try {
      const res = await fetch('/api/chat/messages', this.getFetchOptions('POST', { receiverId, content }));
      
      if (res.ok) {
        const data = await res.json();
        this.messages.update(msgs => [...msgs, data.message]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  async updatePresence(isOnline: boolean) {
    if (!this.initialized) return;
    
    try {
      await fetch('/api/chat/presence', this.getFetchOptions('POST', { isOnline }));
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }

  selectUser(userId: number) {
    this.selectedUserId.set(userId);
    this.fetchMessages(userId);
  }

  clearSelection() {
    this.selectedUserId.set(null);
    this.messages.set([]);
    // Refresh unread count when going back to user list
    this.fetchUnread();
  }

  toggle() {
    const wasOpen = get(this.isOpen);
    if (wasOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    // Always show user list when opening (clear any previous selection)
    this.selectedUserId.set(null);
    this.messages.set([]);
    this.isOpen.set(true);
    this.fetchUsers();
    this.fetchUnread();
  }

  close() {
    this.isOpen.set(false);
    // Clear selection when closing so next open shows user list
    this.selectedUserId.set(null);
    this.messages.set([]);
  }
}

export const chatService = new ChatService();
