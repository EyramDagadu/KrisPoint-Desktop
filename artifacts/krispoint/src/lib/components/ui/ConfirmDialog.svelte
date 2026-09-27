<script>
  import { createEventDispatcher } from 'svelte';
  
  export let show = false;
  export let title = 'Confirm Action';
  export let message = 'Are you sure you want to proceed?';
  export let confirmText = 'Confirm';
  export let cancelText = 'Cancel';
  export let danger = false; // Red confirm button for destructive actions
  
  const dispatch = createEventDispatcher();
  
  function handleConfirm() {
    dispatch('confirm');
    show = false;
  }
  
  function handleCancel() {
    dispatch('cancel');
    show = false;
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }
</script>

{#if show}
  <div class="confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" tabindex="-1" on:click={handleBackdropClick} on:keydown={(e) => e.key === 'Escape' && handleCancel()}>
    <div class="confirm-dialog">
      <div class="confirm-header">
        <h3 id="confirm-dialog-title">{title}</h3>
      </div>
      
      <div class="confirm-body">
        <p>{message}</p>
      </div>
      
      <div class="confirm-actions">
        <button class="btn btn-cancel" on:click={handleCancel}>
          {cancelText}
        </button>
        <button 
          class="btn" 
          class:btn-danger={danger}
          class:btn-primary={!danger}
          on:click={handleConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .confirm-dialog {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 14px;
    box-shadow: var(--shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.25));
    max-width: 32rem;
    width: min(90%, 32rem);
    color: var(--color-text-primary, #111827);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .confirm-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .confirm-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
  }

  .confirm-body {
    padding: 1.5rem;
  }

  .confirm-body p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-text-secondary, #4b5563);
  }

  .confirm-actions {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.625rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .btn-cancel {
    background: var(--color-surface-secondary, #f3f4f6);
    color: var(--color-text-primary, #111827);
    border: 1px solid var(--color-border, #d1d5db);
  }

  .btn-cancel:hover {
    background: var(--color-surface-hover, #e5e7eb);
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }

  .btn-danger:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }

  .btn:focus-visible {
    outline: 3px solid var(--color-focus, #2563eb);
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    .confirm-actions {
      flex-direction: column-reverse;
    }

    .confirm-actions .btn {
      width: 100%;
    }
  }
</style>
