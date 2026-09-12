<script lang="ts">
  import { showIdleWarning, idleTimeRemaining } from '$lib/services/IdleTimeoutService';
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  }
</script>

{#if $showIdleWarning}
  <div class="idle-overlay">
    <div class="idle-modal">
      <div class="idle-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h2>Session Timeout Warning</h2>
      <p class="idle-message">
        Your session will expire due to inactivity in
      </p>
      <div class="countdown">
        {formatTime($idleTimeRemaining)}
      </div>
      <p class="idle-submessage">
        Move your mouse or press any key to continue.
      </p>
    </div>
  </div>
{/if}

<style>
  .idle-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  }
  
  .idle-modal {
    background: var(--color-surface-elevated, #1a1a2e);
    border-radius: 16px;
    padding: 2.5rem;
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid var(--color-border, #333);
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .idle-icon {
    color: var(--color-warning, #f59e0b);
    margin-bottom: 1rem;
  }
  
  h2 {
    color: var(--color-text-primary, #fff);
    font-size: 1.5rem;
    margin: 0 0 1rem 0;
    font-weight: 600;
  }
  
  .idle-message {
    color: var(--color-text-secondary, #aaa);
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
  
  .countdown {
    font-size: 3rem;
    font-weight: 700;
    color: var(--color-warning, #f59e0b);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    margin: 1rem 0;
    letter-spacing: 2px;
  }
  
  .idle-submessage {
    color: var(--color-text-muted, #888);
    font-size: 0.875rem;
    margin: 0;
  }
</style>
