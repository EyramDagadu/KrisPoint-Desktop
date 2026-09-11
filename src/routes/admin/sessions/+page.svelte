<script lang="ts">
  import { onMount } from 'svelte';
  import { toastSuccess, toastError } from '$lib/stores/toastStore.js';

  interface Session {
    id: number;
    userId: number;
    ipAddress: string | null;
    userAgent: string | null;
    deviceInfo: string | null;
    createdAt: string;
    expiresAt: string;
    isValid: boolean;
    userName: string;
    username: string;
    roleName: string;
    isCurrent: boolean;
  }

  let sessions: Session[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    await loadSessions();
  });

  async function loadSessions() {
    loading = true;
    error = '';
    
    try {
      const res = await fetch('/api/admin/sessions', {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        sessions = data.sessions;
      } else {
        error = data.error || 'Failed to load sessions';
      }
    } catch (err) {
      error = 'Failed to load sessions';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function revokeSession(sessionId: number) {
    if (!confirm('Are you sure you want to terminate this session?')) return;
    
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toastSuccess('Session terminated successfully');
        await loadSessions();
      } else {
        toastError(data.error || 'Failed to terminate session');
      }
    } catch (err) {
      toastError('Failed to terminate session');
    }
  }

  async function revokeAllUserSessions(userId: number, userName: string) {
    if (!confirm(`Are you sure you want to terminate all sessions for ${userName}?`)) return;
    
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, revokeAll: true })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toastSuccess(`All sessions for ${userName} terminated`);
        await loadSessions();
      } else {
        toastError(data.error || 'Failed to terminate sessions');
      }
    } catch (err) {
      toastError('Failed to terminate sessions');
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  function parseUserAgent(ua: string | null): string {
    if (!ua) return 'Unknown';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown OS';
  }

  function getTimeRemaining(expiresAt: string): string {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  $: groupedByUser = sessions.reduce((acc, session) => {
    if (!acc[session.userId]) {
      acc[session.userId] = {
        userName: session.userName,
        username: session.username,
        roleName: session.roleName,
        sessions: []
      };
    }
    acc[session.userId].sessions.push(session);
    return acc;
  }, {} as Record<number, { userName: string; username: string; roleName: string; sessions: Session[] }>);
</script>

<div class="sessions-page">
    <div class="page-header">
      <h1>Active Sessions</h1>
      <button class="refresh-btn" on:click={loadSessions} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
    </div>

    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    {#if loading}
      <div class="loading">Loading sessions...</div>
    {:else if sessions.length === 0}
      <div class="empty-state">No active sessions found</div>
    {:else}
      <div class="session-count">
        <span class="count">{sessions.length}</span> active session{sessions.length !== 1 ? 's' : ''} across 
        <span class="count">{Object.keys(groupedByUser).length}</span> user{Object.keys(groupedByUser).length !== 1 ? 's' : ''}
      </div>

      {#each Object.entries(groupedByUser) as [userId, group]}
        <div class="user-group">
          <div class="user-header">
            <div class="user-info">
              <span class="user-name">{group.userName}</span>
              <span class="user-username">@{group.username}</span>
              <span class="user-role">{group.roleName}</span>
            </div>
            {#if group.sessions.length > 1}
              <button 
                class="revoke-all-btn"
                on:click={() => revokeAllUserSessions(Number(userId), group.userName)}
              >
                Terminate All ({group.sessions.length})
              </button>
            {/if}
          </div>

          <div class="sessions-list">
            {#each group.sessions as session}
              <div class="session-card" class:current={session.isCurrent}>
                <div class="session-info">
                  <div class="session-device">
                    <span class="device-icon">
                      {#if session.userAgent?.includes('Mobile')}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                      {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      {/if}
                    </span>
                    <span class="device-os">{parseUserAgent(session.userAgent)}</span>
                    {#if session.isCurrent}
                      <span class="current-badge">Current</span>
                    {/if}
                  </div>
                  <div class="session-meta">
                    <span class="ip-address">{session.ipAddress || 'Unknown IP'}</span>
                    <span class="separator">|</span>
                    <span class="created">Started: {formatDate(session.createdAt)}</span>
                    <span class="separator">|</span>
                    <span class="expires">Expires in: {getTimeRemaining(session.expiresAt)}</span>
                  </div>
                </div>
                <button 
                  class="revoke-btn"
                  on:click={() => revokeSession(session.id)}
                  disabled={session.isCurrent}
                  title={session.isCurrent ? "Cannot terminate your own session" : "Terminate this session"}
                >
                  {session.isCurrent ? 'Current' : 'Terminate'}
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>

<style>
  .sessions-page {
    max-width: 1000px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .page-header h1 {
    margin: 0;
    font-size: 1.75rem;
    color: var(--color-text-primary);
  }

  .refresh-btn {
    padding: 0.5rem 1rem;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: var(--color-surface-hover);
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .session-count {
    margin-bottom: 1.5rem;
    color: var(--color-text-secondary);
  }

  .session-count .count {
    font-weight: 600;
    color: var(--color-primary);
  }

  .error-message {
    padding: 1rem;
    background: var(--color-error-bg, #fee2e2);
    color: var(--color-error, #dc2626);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .loading, .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--color-text-secondary);
  }

  .user-group {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: var(--color-surface-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-name {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .user-username {
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  .user-role {
    padding: 0.25rem 0.5rem;
    background: var(--color-primary-muted, rgba(16, 185, 129, 0.1));
    color: var(--color-primary);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .revoke-all-btn {
    padding: 0.375rem 0.75rem;
    background: var(--color-error-bg, #fee2e2);
    color: var(--color-error, #dc2626);
    border: none;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .revoke-all-btn:hover {
    background: var(--color-error, #dc2626);
    color: white;
  }

  .sessions-list {
    padding: 0.5rem;
  }

  .session-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    margin: 0.5rem;
    background: var(--color-surface-elevated);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .session-card.current {
    border-color: var(--color-primary);
    background: var(--color-primary-muted, rgba(16, 185, 129, 0.05));
  }

  .session-info {
    flex: 1;
  }

  .session-device {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }

  .device-icon {
    color: var(--color-text-secondary);
  }

  .device-os {
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .current-badge {
    padding: 0.125rem 0.5rem;
    background: var(--color-primary);
    color: white;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .session-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .separator {
    color: var(--color-border);
  }

  .revoke-btn {
    padding: 0.5rem 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .revoke-btn:hover:not(:disabled) {
    background: var(--color-error, #dc2626);
    color: white;
    border-color: var(--color-error, #dc2626);
  }

  .revoke-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-surface-elevated);
  }

  @media (max-width: 640px) {
    .session-meta {
      flex-direction: column;
      gap: 0.25rem;
    }

    .separator {
      display: none;
    }

    .session-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .revoke-btn {
      width: 100%;
    }
  }
</style>
