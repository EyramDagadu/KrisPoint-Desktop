<script>
  import { createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  
  export let show = false;
  
  const dispatch = createEventDispatcher();
  
  let backupService = null;
  let isProcessing = false;
  let error = '';
  let successMessage = '';
  let selectedFile = null;
  let fileInput;
  let backupMetadata = null;
  
  $: if (show && !backupService && browser) {
    loadBackupService();
  }
  
  $: if (!show) {
    isProcessing = false;
    error = '';
    successMessage = '';
    selectedFile = null;
    backupMetadata = null;
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
  
  async function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    selectedFile = file;
    error = '';
    backupMetadata = null;
    
    if (!backupService) {
      error = 'Backup service not available';
      return;
    }
    
    const info = await backupService.getBackupInfo(file);
    if (info.success) {
      backupMetadata = info.metadata;
    } else {
      error = info.error || 'Unable to read backup file';
      selectedFile = null;
    }
  }
  
  async function restoreBackup() {
    if (!selectedFile || !backupService) {
      error = 'No backup file selected';
      return;
    }
    
    isProcessing = true;
    error = '';
    successMessage = '';
    
    try {
      const result = await backupService.importData(selectedFile);
      
      if (result.success) {
        successMessage = result.message || 'Backup restored successfully!';
        
        setTimeout(() => {
          dispatch('restored');
          show = false;
          
          setTimeout(() => {
            window.location.href = '/auth';
          }, 500);
        }, 1500);
      } else {
        error = result.error || 'Failed to restore backup';
        isProcessing = false;
      }
    } catch (err) {
      console.error('Restore error:', err);
      error = 'Failed to restore backup';
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
      <div class="modal-header">
        <h2>📥 Restore Backup</h2>
      </div>
      
      <div class="modal-body">
        <p class="message">
          Select a KrisPoint backup file to restore all your data.
        </p>
        
        <div class="file-upload-section">
          <input 
            type="file" 
            accept=".json"
            on:change={handleFileSelect}
            bind:this={fileInput}
            disabled={isProcessing}
            class="file-input"
          />
          
          {#if selectedFile}
            <div class="file-selected">
              <span class="file-icon">📄</span>
              <span class="file-name">{selectedFile.name}</span>
              <span class="file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          {/if}
        </div>
        
        {#if backupMetadata}
          <div class="backup-preview">
            <p><strong>Backup Preview:</strong></p>
            <ul>
              <li>📊 Total items: {backupMetadata.totalItems}</li>
              {#if backupMetadata.users?.length > 0}
                <li>👤 Users: {backupMetadata.users.map(u => u.username).join(', ')}</li>
              {/if}
              <li>📄 Reports: {backupMetadata.reportCount}</li>
              <li>⚙️ Settings: {backupMetadata.hasSettings ? 'Yes' : 'No'}</li>
              <li>🔧 Macros: {backupMetadata.hasMacros ? 'Yes' : 'No'}</li>
              <li>✍️ Signature: {backupMetadata.hasSignature ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        {/if}
        
        <div class="warning-box">
          <p><strong>⚠️ Warning:</strong></p>
          <p>Restoring a backup will <strong>replace ALL current data</strong> in this application with the data from the backup file.</p>
        </div>
        
        {#if successMessage}
          <div class="success-message">
            ✅ {successMessage}
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
          on:click={cancel}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          on:click={restoreBackup}
          disabled={isProcessing || !selectedFile}
        >
          {#if isProcessing}
            <span class="spinner"></span>
            Restoring...
          {:else}
            📥 Restore Backup
          {/if}
        </button>
      </div>
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
  
  .file-upload-section {
    margin: 20px 0;
  }
  
  .file-input {
    width: 100%;
    padding: 12px;
    border: 2px dashed rgba(59, 130, 246, 0.5);
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.05);
    color: var(--text-primary, #f9fafb);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .file-input:hover:not(:disabled) {
    border-color: rgba(59, 130, 246, 0.7);
    background: rgba(59, 130, 246, 0.1);
  }
  
  .file-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .file-selected {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 12px;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 6px;
    color: #22c55e;
  }
  
  .file-icon {
    font-size: 1.2rem;
  }
  
  .file-name {
    font-weight: 500;
    flex: 1;
  }
  
  .file-size {
    font-size: 0.85rem;
    opacity: 0.8;
  }
  
  .backup-preview {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
  }
  
  .backup-preview p {
    margin: 0 0 12px 0;
    color: #60a5fa;
    font-weight: 500;
  }
  
  .backup-preview ul {
    margin: 0;
    padding-left: 20px;
    color: var(--text-secondary, #d1d5db);
  }
  
  .backup-preview li {
    margin: 8px 0;
    line-height: 1.5;
  }
  
  .warning-box {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
  }
  
  .warning-box p {
    margin: 0 0 8px 0;
    color: #fbbf24;
    line-height: 1.5;
  }
  
  .warning-box p:last-child {
    margin-bottom: 0;
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
