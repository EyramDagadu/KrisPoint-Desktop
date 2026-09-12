<script>
  import { createEventDispatcher } from 'svelte';
  import { currentUser } from '$lib/stores/authStore.js';
  
  export let isOpen = false;
  export let reportId = null;
  export let addendums = [];
  export let canAddAddendum = false;
  
  const dispatch = createEventDispatcher();
  
  let showCreateForm = false;
  let reason = '';
  let content = '';
  let isSubmitting = false;
  let error = '';
  
  let showSubmitModal = false;
  let selectedAddendum = null;
  let selectedSpecialistId = null;
  let specialists = [];
  let loadingSpecialists = false;
  
  $: signedAddendums = addendums.filter(a => a.status === 'SIGNED');
  $: pendingAddendums = addendums.filter(a => a.status !== 'SIGNED');
  
  function close() {
    isOpen = false;
    resetForm();
    dispatch('close');
  }
  
  function resetForm() {
    showCreateForm = false;
    reason = '';
    content = '';
    error = '';
  }
  
  async function loadSpecialists() {
    loadingSpecialists = true;
    try {
      const response = await fetch('/api/users/specialists', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        specialists = data.specialists;
      }
    } catch (err) {
      console.error('Failed to load specialists:', err);
    } finally {
      loadingSpecialists = false;
    }
  }
  
  async function handleCreate() {
    if (!reason.trim() || !content.trim()) {
      error = 'Please fill in both reason and content';
      return;
    }
    
    isSubmitting = true;
    error = '';
    
    try {
      const response = await fetch(`/api/reports/${reportId}/addendums`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reason.trim(),
          content: content.trim(),
          amendmentType: 'ADDENDUM'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch('addendumCreated', data.addendum);
        resetForm();
      } else {
        error = data.error || 'Failed to create addendum';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  function openSubmitModal(addendum) {
    selectedAddendum = addendum;
    showSubmitModal = true;
    loadSpecialists();
  }
  
  function closeSubmitModal() {
    showSubmitModal = false;
    selectedAddendum = null;
    selectedSpecialistId = null;
  }
  
  async function handleSubmitAddendum() {
    if (!selectedSpecialistId || !selectedAddendum) return;
    
    isSubmitting = true;
    try {
      const response = await fetch(`/api/reports/${reportId}/addendums/${selectedAddendum.id}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ specialistId: selectedSpecialistId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch('addendumSubmitted', data.addendum);
        closeSubmitModal();
      } else {
        error = data.error || 'Failed to submit addendum';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  async function handleSignAddendum(addendum) {
    isSubmitting = true;
    try {
      const response = await fetch(`/api/reports/${reportId}/addendums/${addendum.id}/sign`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch('addendumSigned', data.addendum);
      } else {
        error = data.error || 'Failed to sign addendum';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  async function handleReturnAddendum(addendum) {
    isSubmitting = true;
    try {
      const response = await fetch(`/api/reports/${reportId}/addendums/${addendum.id}/return`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback: '' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch('addendumReturned', data.addendum);
      } else {
        error = data.error || 'Failed to return addendum';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  async function handleDeleteAddendum(addendum) {
    if (!confirm('Are you sure you want to delete this addendum?')) return;
    
    isSubmitting = true;
    try {
      const response = await fetch(`/api/reports/${reportId}/addendums/${addendum.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch('addendumDeleted', addendum.id);
      } else {
        error = data.error || 'Failed to delete addendum';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  }
  
  function canSubmit(addendum) {
    return addendum.status === 'DRAFT' && addendum.createdBy === $currentUser?.id;
  }
  
  function canSign(addendum) {
    return addendum.status === 'SUBMITTED' && addendum.assignedSpecialistId === $currentUser?.id;
  }
  
  function canReturn(addendum) {
    return addendum.status === 'SUBMITTED' && addendum.assignedSpecialistId === $currentUser?.id;
  }
  
  function canDelete(addendum) {
    return addendum.status === 'DRAFT' && addendum.createdBy === $currentUser?.id;
  }
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={close}>
    <div class="addendum-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Report Addendums</h3>
        <button class="close-btn" on:click={close}>×</button>
      </div>
      
      <div class="modal-body">
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        
        {#if signedAddendums.length > 0}
          <div class="addendum-section">
            <h4>Signed Addendums</h4>
            {#each signedAddendums as addendum}
              <div class="addendum-card signed">
                <div class="addendum-meta">
                  <span class="addendum-by">{addendum.creatorName || 'Unknown'}</span>
                  <span class="addendum-date">{formatDate(addendum.signedAt)}</span>
                  <span class="status-badge signed">Signed</span>
                </div>
                <div class="addendum-reason"><strong>Reason:</strong> {addendum.reason}</div>
                <div class="addendum-content">{addendum.content}</div>
              </div>
            {/each}
          </div>
        {/if}
        
        {#if pendingAddendums.length > 0}
          <div class="addendum-section">
            <h4>Pending Addendums</h4>
            {#each pendingAddendums as addendum}
              <div class="addendum-card {addendum.status.toLowerCase()}">
                <div class="addendum-meta">
                  <span class="addendum-by">{addendum.creatorName || 'Unknown'}</span>
                  <span class="addendum-date">{formatDate(addendum.createdAt)}</span>
                  <span class="status-badge {addendum.status.toLowerCase()}">{addendum.status}</span>
                </div>
                <div class="addendum-reason"><strong>Reason:</strong> {addendum.reason}</div>
                <div class="addendum-content">{addendum.content}</div>
                
                <div class="addendum-actions">
                  {#if canSubmit(addendum)}
                    <button class="btn-sm btn-submit" on:click={() => openSubmitModal(addendum)} disabled={isSubmitting}>
                      Submit for Review
                    </button>
                    <button class="btn-sm btn-delete" on:click={() => handleDeleteAddendum(addendum)} disabled={isSubmitting}>
                      Delete
                    </button>
                  {/if}
                  {#if canSign(addendum)}
                    <button class="btn-sm btn-sign" on:click={() => handleSignAddendum(addendum)} disabled={isSubmitting}>
                      Sign Addendum
                    </button>
                    <button class="btn-sm btn-return" on:click={() => handleReturnAddendum(addendum)} disabled={isSubmitting}>
                      Return
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
        
        {#if addendums.length === 0 && !showCreateForm}
          <div class="no-addendums">No addendums have been added to this report yet.</div>
        {/if}
        
        {#if canAddAddendum && !showCreateForm}
          <button class="btn btn-add" on:click={() => showCreateForm = true}>
            + Add New Addendum
          </button>
        {/if}
        
        {#if showCreateForm}
          <div class="create-form">
            <h4>Add New Addendum</h4>
            <div class="form-group">
              <label>Reason for Addendum</label>
              <input type="text" bind:value={reason} placeholder="e.g., Additional finding, Correction, Clarification" />
            </div>
            <div class="form-group">
              <label>Addendum Content</label>
              <textarea bind:value={content} rows="5" placeholder="Enter the addendum text..."></textarea>
            </div>
            <div class="form-actions">
              <button class="btn btn-outline" on:click={resetForm}>Cancel</button>
              <button class="btn btn-primary" on:click={handleCreate} disabled={isSubmitting || !reason.trim() || !content.trim()}>
                {isSubmitting ? 'Creating...' : 'Create Addendum'}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if showSubmitModal}
  <div class="modal-overlay" on:click={closeSubmitModal}>
    <div class="submit-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Submit Addendum for Review</h3>
        <button class="close-btn" on:click={closeSubmitModal}>×</button>
      </div>
      <div class="modal-body">
        <p>Select a specialist to review and sign this addendum:</p>
        {#if loadingSpecialists}
          <div class="loading">Loading specialists...</div>
        {:else if specialists.length === 0}
          <div class="no-specialists">No specialists available</div>
        {:else}
          <select bind:value={selectedSpecialistId} class="specialist-select">
            <option value={null}>-- Select a Specialist --</option>
            {#each specialists as specialist}
              <option value={specialist.id}>
                {specialist.name}{specialist.specialty ? ` - ${specialist.specialty}` : ''}
              </option>
            {/each}
          </select>
        {/if}
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" on:click={closeSubmitModal}>Cancel</button>
        <button class="btn btn-submit" on:click={handleSubmitAddendum} disabled={!selectedSpecialistId || isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .addendum-modal, .submit-modal {
    background: var(--bg-primary, #ffffff);
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color, #e5e7eb);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background: var(--bg-primary, #ffffff);
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-primary, #1f2937);
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 0.25rem;
    line-height: 1;
  }
  
  .close-btn:hover {
    color: var(--text-primary);
  }
  
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
    background: var(--bg-primary, #ffffff);
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color, #e5e7eb);
    background: var(--bg-primary, #ffffff);
  }
  
  .error-message {
    background: var(--error-bg, #fee2e2);
    color: var(--error-text, #dc2626);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }
  
  .addendum-section {
    margin-bottom: 1.5rem;
  }
  
  .addendum-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .addendum-card {
    background: var(--bg-secondary, #f9fafb);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border-left: 3px solid var(--border-color, #e5e7eb);
  }
  
  .addendum-card.signed {
    border-left-color: #10b981;
  }
  
  .addendum-card.draft {
    border-left-color: #f59e0b;
  }
  
  .addendum-card.submitted {
    border-left-color: #3b82f6;
  }
  
  .addendum-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
  }
  
  .addendum-by {
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .addendum-date {
    color: var(--text-secondary);
  }
  
  .status-badge {
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-badge.signed {
    background: #d1fae5;
    color: #065f46;
  }
  
  .status-badge.draft {
    background: #fef3c7;
    color: #92400e;
  }
  
  .status-badge.submitted {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .addendum-reason {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }
  
  .addendum-content {
    color: var(--text-primary);
    line-height: 1.6;
    white-space: pre-wrap;
  }
  
  .addendum-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color);
  }
  
  .no-addendums {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }
  
  .btn-add {
    width: 100%;
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 2px dashed var(--border-color);
    margin-top: 1rem;
  }
  
  .btn-add:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  
  .btn-primary {
    background: var(--primary-color, #3b82f6);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover, #2563eb);
  }
  
  .btn-outline {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);
  }
  
  .btn-outline:hover {
    background: var(--bg-secondary);
  }
  
  .btn-submit {
    background: #3b82f6;
    color: white;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
    border-radius: 4px;
    cursor: pointer;
    border: none;
  }
  
  .btn-sm.btn-submit {
    background: #3b82f6;
    color: white;
  }
  
  .btn-sm.btn-sign {
    background: #10b981;
    color: white;
  }
  
  .btn-sm.btn-return {
    background: #f59e0b;
    color: white;
  }
  
  .btn-sm.btn-delete {
    background: #ef4444;
    color: white;
  }
  
  .create-form {
    background: var(--bg-secondary, #f9fafb);
    border-radius: 8px;
    padding: 1.25rem;
    margin-top: 1rem;
    border: 1px solid var(--border-color, #e5e7eb);
  }
  
  .create-form h4 {
    margin: 0 0 1rem 0;
    color: var(--text-primary, #1f2937);
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.95rem;
  }
  
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
  
  .specialist-select {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.95rem;
  }
  
  .loading, .no-specialists {
    text-align: center;
    padding: 1rem;
    color: var(--text-secondary);
  }
</style>
