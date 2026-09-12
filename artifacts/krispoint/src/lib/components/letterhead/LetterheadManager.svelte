<script>
    import { onMount } from 'svelte';
    import { letterheadStore, letterheadActions } from '../../stores/letterheadStore.js';
    import LetterheadUpload from './LetterheadUpload.svelte';
    import LetterheadPreview from './LetterheadPreview.svelte';
    import ConfirmDialog from '../ui/ConfirmDialog.svelte';
    import { toastSuccess, toastError } from '$lib/utils/toast.js';
    
    export let isAdmin = true;
    
    let showUpload = false;
    let showDeleteConfirm = false;
    let letterheadToDelete = null;
    
    onMount(() => {
        letterheadActions.loadFromServer();
    });
    
    async function handleLetterheadSelect(letterhead) {
        letterheadActions.setCurrentLetterhead(letterhead);
        const saved = await letterheadActions.saveToServer();
        if (saved) {
            toastSuccess('Letterhead set for all users');
        } else {
            toastError('Failed to save letterhead. You may not have permission.');
        }
    }
    
    function handleLetterheadRemove(letterhead) {
        letterheadToDelete = letterhead;
        showDeleteConfirm = true;
    }

    async function confirmDelete() {
        if (letterheadToDelete) {
            letterheadActions.removeLetterhead(letterheadToDelete.id);
            const deleted = await letterheadActions.deleteFromServer();
            if (deleted) {
                toastSuccess('Letterhead deleted successfully');
            } else {
                toastError('Failed to delete letterhead. You may not have permission.');
            }
            letterheadToDelete = null;
        }
    }
    
    async function handleClearSelection() {
        letterheadActions.clearCurrentLetterhead();
        await letterheadActions.saveToServer();
    }
    
    async function handleUploadSuccess(event) {
        const letterhead = event.detail;
        letterheadActions.addLetterhead(letterhead);
        letterheadActions.setCurrentLetterhead(letterhead);
        const saved = await letterheadActions.saveToServer();
        if (saved) {
            toastSuccess('Letterhead uploaded and saved for all users');
        } else {
            toastError('Letterhead uploaded but failed to save to server. You may not have permission.');
        }
        showUpload = false;
    }
</script>

<div class="letterhead-manager">
    <div class="manager-header">
        <h3>🏥 Letterhead Management</h3>
        <p>
            {#if isAdmin}
                Upload and manage your hospital letterheads for professional reports
            {:else}
                View the organization letterhead used on professional reports
            {/if}
        </p>
        {#if !isAdmin}
            <p class="admin-note">Letterhead is set by the administrator and applies to all users.</p>
        {/if}
    </div>

    <!-- Current Selection -->
    {#if $letterheadStore.currentLetterhead}
        <div class="current-selection">
            <h4>📄 Current Letterhead</h4>
            <div class="current-letterhead">
                <img 
                    src={$letterheadStore.currentLetterhead.url} 
                    alt={$letterheadStore.currentLetterhead.name}
                    class="current-image"
                />
                <div class="current-info">
                    <span class="current-name">{$letterheadStore.currentLetterhead.name}</span>
                    {#if isAdmin}
                        <button 
                            class="clear-btn"
                            on:click={handleClearSelection}
                        >
                            Remove
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <div class="no-selection">
            {#if isAdmin}
                <p>No letterhead selected. Choose one below or upload a new one.</p>
            {:else}
                <p>No letterhead has been set by the administrator yet.</p>
            {/if}
        </div>
    {/if}

    <!-- Upload Section (Admin only) -->
    {#if isAdmin}
        <div class="upload-section">
            {#if showUpload}
                <LetterheadUpload 
                    on:success={handleUploadSuccess}
                    on:cancel={() => showUpload = false}
                />
            {:else}
                <button 
                    class="upload-btn"
                    on:click={() => showUpload = true}
                >
                    📁 Upload New Letterhead
                </button>
            {/if}
        </div>
    {/if}

    <!-- Available Letterheads (Admin only for actions) -->
    {#if $letterheadStore.letterheads.length > 0 && isAdmin}
        <div class="letterheads-grid">
            <h4>Available Letterheads</h4>
            <div class="grid">
                {#each $letterheadStore.letterheads as letterhead (letterhead.id)}
                    <div 
                        class="letterhead-card"
                        class:selected={$letterheadStore.currentLetterhead?.id === letterhead.id}
                    >
                        <img 
                            src={letterhead.url} 
                            alt={letterhead.name}
                            class="letterhead-thumb"
                            on:click={() => handleLetterheadSelect(letterhead)}
                        />
                        <div class="card-info">
                            <span class="letterhead-name">{letterhead.name}</span>
                            <div class="card-actions">
                                <button 
                                    class="use-btn"
                                    on:click={() => handleLetterheadSelect(letterhead)}
                                    disabled={$letterheadStore.currentLetterhead?.id === letterhead.id}
                                >
                                    {$letterheadStore.currentLetterhead?.id === letterhead.id ? 'Current' : 'Use'}
                                </button>
                                <button 
                                    class="delete-btn"
                                    on:click={() => handleLetterheadRemove(letterhead)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Preview Section -->
    {#if $letterheadStore.currentLetterhead}
        <div class="preview-section">
            <LetterheadPreview letterhead={$letterheadStore.currentLetterhead} />
        </div>
    {/if}
</div>

<style>
    .letterhead-manager {
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
    }
    
    .manager-header {
        text-align: center;
        margin-bottom: 30px;
    }
    
    .manager-header h3 {
        color: var(--text-primary);
        margin-bottom: 8px;
        font-size: 1.4rem;
    }
    
    .manager-header p {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    
    .manager-header .admin-note {
        background: var(--background-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 8px 12px;
        margin-top: 8px;
        font-size: 0.85rem;
        font-style: italic;
    }
    
    .current-selection {
        background: var(--background-secondary);
        border: 2px solid var(--accent-color);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .current-selection h4 {
        color: var(--accent-color);
        margin-bottom: 15px;
        font-size: 1.1rem;
    }
    
    .current-letterhead {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .current-image {
        width: 150px;
        height: 75px;
        object-fit: contain;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: white;
        display: block;
    }
    
    .current-info {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .current-name {
        font-weight: 500;
        color: var(--text-primary);
    }
    
    .clear-btn {
        background: var(--error-color);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
    }
    
    .clear-btn:hover {
        background: #d32f2f;
    }
    
    .no-selection {
        background: var(--background-secondary);
        border: 2px dashed var(--border-color);
        border-radius: 12px;
        padding: 30px;
        text-align: center;
        margin-bottom: 20px;
        color: var(--text-secondary);
    }
    
    .upload-section {
        margin-bottom: 30px;
    }
    
    .upload-btn {
        background: var(--color-primary);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 auto;
    }
    
    .upload-btn:hover {
        background: var(--color-primary-hover);
    }
    
    .letterheads-grid h4 {
        color: var(--text-primary);
        margin-bottom: 15px;
        font-size: 1.1rem;
    }
    
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
    }
    
    .letterhead-card {
        background: var(--background-secondary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 12px;
        transition: all 0.2s ease;
    }
    
    .letterhead-card:hover {
        border-color: var(--accent-color);
    }
    
    .letterhead-card.selected {
        border-color: var(--color-primary);
        background: var(--background-tertiary);
    }
    
    .letterhead-thumb {
        width: 100%;
        height: 100px;
        object-fit: contain;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        margin-bottom: 8px;
        cursor: pointer;
        background: white;
        display: block;
    }
    
    .letterhead-thumb:hover {
        border-color: var(--accent-color);
    }
    
    .card-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .letterhead-name {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .card-actions {
        display: flex;
        gap: 8px;
    }
    
    .use-btn {
        flex: 1;
        background: var(--color-primary);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
    }
    
    .use-btn:hover:not(:disabled) {
        background: var(--color-primary-hover);
    }
    
    .use-btn:disabled {
        background: var(--border-color);
        color: var(--text-secondary);
        cursor: not-allowed;
    }
    
    .delete-btn {
        background: var(--error-color);
        color: white;
        border: none;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
    }
    
    .delete-btn:hover {
        background: #d32f2f;
    }
    
    .preview-section {
        margin-top: 30px;
        border-top: 1px solid var(--border-color);
        padding-top: 20px;
    }
</style>

<ConfirmDialog
  bind:show={showDeleteConfirm}
  title="Delete Letterhead?"
  message={letterheadToDelete ? `Are you sure you want to delete "${letterheadToDelete.name}"? This action cannot be undone.` : 'Are you sure you want to delete this letterhead?'}
  confirmText="Delete"
  cancelText="Cancel"
  danger={true}
  on:confirm={confirmDelete}
/>