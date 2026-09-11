<script>
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  
  export let show = false;
  
  const dispatch = createEventDispatcher();
  
  let step = 1;
  let backupService = null;
  let isProcessing = false;
  let backupDownloaded = false;
  let error = '';
  
  $: if (show && !backupService && browser) {
    loadBackupService();
  }
  
  $: if (!show) {
    step = 1;
    isProcessing = false;
    backupDownloaded = false;
    error = '';
  }
  
  async function loadBackupService() {
    try {
      const module = await import('$lib/services/BackupService.js');
      backupService = module.backupService;
    } catch (err) {
      console.error('Failed to load BackupService:', err);
      error = 'Failed to load backup service';
    }
  }
  
  async function downloadBackup() {
    if (!backupService) {
      error = 'Backup service not available';
      return;
    }
    
    isProcessing = true;
    error = '';
    
    try {
      const result = backupService.exportAllData();
      
      if (result.success) {
        backupDownloaded = true;
        setTimeout(() => {
          step = 2;
          isProcessing = false;
        }, 500);
      } else {
        error = result.error || 'Failed to create backup';
        isProcessing = false;
      }
    } catch (err) {
      console.error('Backup error:', err);
      error = 'Failed to create backup';
      isProcessing = false;
    }
  }
  
  function skipBackup() {
    step = 2;
  }
  
  async function confirmReset() {
    if (!backupService) {
      error = 'Backup service not available';
      return;
    }
    
    isProcessing = true;
    error = '';
    
    try {
      const result = backupService.clearAllData();
      
      if (result.success) {
        dispatch('confirmed');
        show = false;
        
        setTimeout(() => {
          window.location.href = '/auth';
        }, 500);
      } else {
        error = result.error || 'Failed to reset app';
        isProcessing = false;
      }
    } catch (err) {
      console.error('Reset error:', err);
      error = 'Failed to reset app';
      isProcessing = false;
    }
  }
  
  function cancel() {
    show = false;
    dispatch('cancel');
  }
  
  function handleOverlayClick() {
    if (!isProcessing) {
      cancel();
    }
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={handleOverlayClick}>
    <div class="modal-content" on:click|stopPropagation>
      {#if step === 1}
        <div class="modal-header">
          <h2>💾 Backup Your Data</h2>
        </div>
        
        <div class="modal-body">
          <p class="message">
            Before resetting the app, would you like to download a backup of all your data?
          </p>
          
          <div class="backup-info">
            <p><strong>Your backup will include:</strong></p>
            <ul>
              <li>All reports and drafts</li>
              <li>User profile and settings</li>
              <li>Signatures and letterheads</li>
              <li>Custom macros and templates</li>
            </ul>
          </div>
          
          {#if backupDownloaded}
            <div class="success-message">
              ✅ Backup downloaded successfully! Proceeding to reset confirmation...
            </div>
          {/if}
          
          {#if error}
            <div class="error-message">
              ⚠️ {error}
            </div>
          {/if}
        </div>
        
        <div class="modal-footer">
          <button 
            class="btn btn-secondary" 
            on:click={skipBackup}
            disabled={isProcessing}
          >
            Skip Backup
          </button>
          <button 
            class="btn btn-primary" 
            on:click={downloadBackup}
            disabled={isProcessing}
          >
            {#if isProcessing}
              <span class="spinner"></span>
              Downloading...
            {:else}
              💾 Download Backup
            {/if}
          </button>
        </div>
      {:else if step === 2}
        <div class="modal-header warning">
          <h2>⚠️ Reset App - Final Confirmation</h2>
        </div>
        
        <div class="modal-body">
          <p class="warning-message">
            <strong>Are you absolutely sure?</strong>
          </p>
          
          <p class="message">
            This will permanently delete <strong>ALL</strong> data from this application:
          </p>
          
          <div class="danger-list">
            <ul>
              <li>🗑️ All user accounts and profiles</li>
              <li>🗑️ All reports (drafts and finalized)</li>
              <li>🗑️ All settings and preferences</li>
              <li>🗑️ All signatures and letterheads</li>
              <li>🗑️ All custom macros and templates</li>
            </ul>
          </div>
          
          <p class="final-warning">
            <strong>⛔ This action CANNOT be undone!</strong>
          </p>
          
          {#if error}
            <div class="error-message">
              ⚠️ {error}
            </div>
          {/if}
        </div>
        
        <div class="modal-footer">
          <button 
            class="btn btn-secondary" 
            on:click={cancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            class="btn btn-danger" 
            on:click={confirmReset}
            disabled={isProcessing}
          >
            {#if isProcessing}
              <span class="spinner"></span>
              Resetting...
            {:else}
              🗑️ Reset App
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  }
  
  .modal-content {
    background: var(--color-bg-secondary, #1f2937);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    max-width: 550px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  
  .modal-header {
    padding: 24px 24px 16px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .modal-header.warning {
    background: rgba(239, 68, 68, 0.05);
    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.4rem;
    color: var(--text-primary, #f9fafb);
    font-weight: 600;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .message {
    color: var(--text-secondary, #d1d5db);
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  
  .warning-message {
    color: #fbbf24;
    font-size: 1.1rem;
    margin-bottom: 16px;
  }
  
  .final-warning {
    color: #ef4444;
    font-size: 1.05rem;
    margin-top: 20px;
    padding: 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    text-align: center;
  }
  
  .backup-info {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
  }
  
  .backup-info p {
    margin: 0 0 12px 0;
    color: #60a5fa;
    font-weight: 500;
  }
  
  .backup-info ul,
  .danger-list ul {
    margin: 0;
    padding-left: 20px;
    color: var(--text-secondary, #d1d5db);
  }
  
  .backup-info li,
  .danger-list li {
    margin: 8px 0;
    line-height: 1.5;
  }
  
  .danger-list {
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
  }
  
  .danger-list li {
    color: #fca5a5;
  }
  
  .success-message {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
    padding: 12px 16px;
    border-radius: 6px;
    margin: 16px 0;
    text-align: center;
    font-weight: 500;
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 12px 16px;
    border-radius: 6px;
    margin: 16px 0;
    text-align: center;
  }
  
  .modal-footer {
    padding: 16px 24px 24px 24px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary, #f9fafb);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .btn-danger {
    background: #ef4444;
    color: white;
  }
  
  .btn-danger:hover:not(:disabled) {
    background: #dc2626;
  }
  
  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 640px) {
    .modal-content {
      width: 95%;
      max-height: 90vh;
    }
    
    .modal-header h2 {
      font-size: 1.2rem;
    }
    
    .modal-footer {
      flex-direction: column;
    }
    
    .btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>
