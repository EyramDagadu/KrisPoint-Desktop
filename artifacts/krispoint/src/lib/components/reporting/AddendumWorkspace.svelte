<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import TextAlign from '@tiptap/extension-text-align';
  import Underline from '@tiptap/extension-underline';
  import { currentUser } from '$lib/stores/authStore.js';
  import Tooltip from '$lib/components/ui/Tooltip.svelte';
  import { enhancedVoiceService } from '$lib/services/EnhancedVoiceService.js';
  import { uiState, uiActions } from '$lib/stores/reportStore.js';
  
  export let reportId = null;
  export let isOpen = false;
  export let signedAddendums = [];
  export let canAddAddendum = false;
  export let isAssignedSpecialist = false;
  export let isSigner = false;
  export let hasSpecialistReview = false;  // Whether original report was co-signed by specialist
  export let originalReportReviewedBy = null;  // Specialist who reviewed original report (if any)
  
  const dispatch = createEventDispatcher();
  
  let editorElement;
  let editor = null;
  let reason = '';
  let isSubmitting = false;
  let error = '';
  let showEditor = false;
  
  let pendingAddendums = [];
  let editingAddendum = null;
  let selectedSpecialistId = null;
  let specialists = [];
  let loadingSpecialists = false;
  let showSubmitModal = false;
  
  // Compact voice control state
  $: isListening = $uiState.isListening;
  let voiceConnected = false;
  let isReconnecting = false;
  let keyboardShortcutService = null;
  
  $: if (isOpen && reportId) {
    loadAddendums();
  }
  
  onMount(async () => {
    if (isOpen) {
      loadAddendums();
    }
    // Check initial voice connection status
    voiceConnected = enhancedVoiceService.whisperInitialized || false;
    
    // Set up keyboard shortcut for voice toggle
    try {
      const { keyboardShortcutService: kss } = await import('$lib/services/KeyboardShortcutService.js');
      keyboardShortcutService = kss;
      if (keyboardShortcutService) {
        keyboardShortcutService.on('toggleVoice', toggleVoice);
      }
    } catch (err) {
      console.error('Failed to load keyboard shortcuts:', err);
    }
  });
  
  onDestroy(() => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
    window.addendumTiptapEditor = null;
    
    // Clean up keyboard shortcut listener
    if (keyboardShortcutService) {
      keyboardShortcutService.off('toggleVoice', toggleVoice);
    }
  });
  
  // Compact voice control functions
  async function toggleVoice() {
    console.log('🎤 toggleVoice called, isListening:', isListening, 'voiceConnected:', voiceConnected);
    if (isListening) {
      enhancedVoiceService.stopListening();
    } else {
      // Connect first if not connected
      if (!voiceConnected) {
        console.log('🎤 Voice not connected, attempting connection...');
        await connectVoice();
      }
      if (voiceConnected) {
        console.log('🎤 Starting listening...');
        enhancedVoiceService.startListening();
      } else {
        console.error('🎤 Cannot start listening - voice server not connected');
        uiActions.showErrorNotification('Voice server not connected. Make sure the Python voice server is running.');
      }
    }
  }
  
  async function connectVoice() {
    if (isReconnecting) return;
    isReconnecting = true;
    console.log('🎤 Connecting to voice server...');
    try {
      await enhancedVoiceService.initializeWhisper();
      voiceConnected = enhancedVoiceService.whisperInitialized;
      console.log('🎤 Voice connection result:', voiceConnected);
      if (voiceConnected) {
        uiActions.showSuccessNotification('Voice server connected');
      }
    } catch (err) {
      console.error('Voice connection failed:', err);
      voiceConnected = false;
      uiActions.showErrorNotification('Voice server connection failed');
    } finally {
      isReconnecting = false;
    }
  }
  
  function initEditor(content = '', editable = true) {
    if (editor) {
      editor.destroy();
    }
    
    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] }
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
      ],
      content: content,
      editable: editable,
      editorProps: {
        attributes: {
          class: 'addendum-tiptap-editor',
          spellcheck: 'true',
        },
      },
    });
    
    window.addendumTiptapEditor = editor;
  }
  
  async function loadAddendums() {
    try {
      const response = await fetch(`/api/reports/${reportId}/addendums`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        pendingAddendums = data.addendums.filter(a => a.status !== 'SIGNED');
        signedAddendums = data.addendums.filter(a => a.status === 'SIGNED');
        
        if (pendingAddendums.length > 0) {
          const myPending = pendingAddendums.find(a => 
            a.createdBy === $currentUser?.id || 
            (a.status === 'SUBMITTED' && a.assignedSpecialistId === $currentUser?.id)
          );
          if (myPending) {
            startEditingAddendum(myPending);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load addendums:', err);
    }
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
  
  function startNewAddendum() {
    showEditor = true;
    editingAddendum = null;
    reason = '';
    setTimeout(() => {
      if (editorElement) {
        initEditor('');
      }
    }, 50);
  }
  
  function startEditingAddendum(addendum) {
    showEditor = true;
    editingAddendum = addendum;
    reason = addendum.reason || '';
    
    const isWaitingForReview = addendum.status === 'SUBMITTED' && 
                               addendum.assignedSpecialistId !== $currentUser?.id;
    
    setTimeout(() => {
      if (editorElement) {
        initEditor(addendum.content || '', !isWaitingForReview);
      }
    }, 50);
  }
  
  function cancelEditor() {
    showEditor = false;
    editingAddendum = null;
    reason = '';
    if (editor) {
      editor.destroy();
      editor = null;
    }
    window.addendumTiptapEditor = null;
  }
  
  async function handleSaveDraft() {
    if (!reason.trim()) {
      error = 'Please provide a reason for the addendum';
      return;
    }
    
    const content = editor?.getHTML() || '';
    if (!content || content === '<p></p>') {
      error = 'Please add content to the addendum';
      return;
    }
    
    isSubmitting = true;
    error = '';
    
    try {
      if (editingAddendum) {
        const response = await fetch(`/api/reports/${reportId}/addendums/${editingAddendum.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: reason.trim(), content })
        });
        
        const data = await response.json();
        if (data.success) {
          editingAddendum = data.addendum;
          dispatch('addendumUpdated', data.addendum);
          loadAddendums();
        } else {
          error = data.error || 'Failed to save addendum';
        }
      } else {
        const response = await fetch(`/api/reports/${reportId}/addendums`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: reason.trim(),
            content,
            amendmentType: 'ADDENDUM'
          })
        });
        
        const data = await response.json();
        if (data.success) {
          editingAddendum = data.addendum;
          dispatch('addendumCreated', data.addendum);
          loadAddendums();
        } else {
          error = data.error || 'Failed to create addendum';
        }
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  function openSubmitModal() {
    if (!editingAddendum) return;
    
    // If the original report had a specialist review, auto-assign to that specialist
    if (hasSpecialistReview && originalReportReviewedBy) {
      // Skip modal, directly submit to original specialist
      handleSubmitToOriginalSpecialist();
    } else {
      // Original report was self-signed, show modal with options
      showSubmitModal = true;
      loadSpecialists();
    }
  }
  
  function closeSubmitModal() {
    showSubmitModal = false;
    selectedSpecialistId = null;
  }
  
  // Submit directly to the original report's specialist
  async function handleSubmitToOriginalSpecialist() {
    if (!editingAddendum || !originalReportReviewedBy) return;
    
    await handleSaveDraft();
    if (error) return;
    
    isSubmitting = true;
    try {
      const response = await fetch(`/api/reports?id=${reportId}&action=addendum-submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addendumId: editingAddendum.id, specialistId: originalReportReviewedBy })
      });
      
      const data = await response.json();
      if (data.success) {
        dispatch('addendumSubmitted', data.addendum);
        cancelEditor();
        goto('/worklist');
      } else {
        error = data.error || 'Failed to submit addendum';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  async function handleSubmitAddendum() {
    if (!selectedSpecialistId || !editingAddendum) return;
    
    await handleSaveDraft();
    if (error) return;
    
    isSubmitting = true;
    try {
      const response = await fetch(`/api/reports?id=${reportId}&action=addendum-submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addendumId: editingAddendum.id, specialistId: selectedSpecialistId })
      });
      
      const data = await response.json();
      if (data.success) {
        dispatch('addendumSubmitted', data.addendum);
        cancelEditor();
        goto('/worklist');
      } else {
        error = data.error || 'Failed to submit addendum';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
      closeSubmitModal();
    }
  }
  
  async function handleSignAddendum() {
    if (!editingAddendum) return;
    
    await handleSaveDraft();
    if (error) return;
    
    isSubmitting = true;
    try {
      const response = await fetch(`/api/reports?id=${reportId}&action=addendum-sign`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addendumId: editingAddendum.id })
      });
      
      const data = await response.json();
      if (data.success) {
        dispatch('addendumSigned', data.addendum);
        cancelEditor();
        goto('/worklist');
      } else {
        error = data.error || 'Failed to sign addendum';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  async function handleReturnAddendum() {
    if (!editingAddendum) return;
    
    isSubmitting = true;
    try {
      const response = await fetch(`/api/reports?id=${reportId}&action=addendum-return`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addendumId: editingAddendum.id, reason: '' })
      });
      
      const data = await response.json();
      if (data.success) {
        dispatch('addendumReturned', data.addendum);
        cancelEditor();
        goto('/worklist');
      } else {
        error = data.error || 'Failed to return addendum';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function toggleBold() { editor?.chain().focus().toggleBold().run(); }
  function toggleItalic() { editor?.chain().focus().toggleItalic().run(); }
  function toggleUnderline() { editor?.chain().focus().toggleUnderline().run(); }
  function toggleBulletList() { editor?.chain().focus().toggleBulletList().run(); }
  function toggleOrderedList() { editor?.chain().focus().toggleOrderedList().run(); }
  function undo() { editor?.chain().focus().undo().run(); }
  function redo() { editor?.chain().focus().redo().run(); }
</script>

{#if isOpen}
  <div class="addendum-workspace">
    {#if signedAddendums.length > 0}
      <div class="signed-addendums">
        {#each signedAddendums as addendum}
          <div class="signed-addendum-section">
            <div class="addendum-header">
              <h3>Addendum — {formatDate(addendum.signedAt)}</h3>
              <span class="signed-by">Signed by: {addendum.signerName || 'Unknown'}</span>
            </div>
            <div class="addendum-reason">
              <strong>Reason:</strong> {addendum.reason}
            </div>
            <div class="addendum-content-readonly">
              {@html addendum.content}
            </div>
          </div>
        {/each}
      </div>
    {/if}
    
    {#if pendingAddendums.length > 0 && !showEditor}
      <div class="pending-addendums">
        <h4>Pending Addendums</h4>
        {#each pendingAddendums as addendum}
          <div class="pending-addendum-card">
            <div class="pending-info">
              <span class="status-badge {addendum.status.toLowerCase()}">{addendum.status}</span>
              <span class="reason">{addendum.reason}</span>
            </div>
            {#if addendum.createdBy === $currentUser?.id || (addendum.status === 'SUBMITTED' && addendum.assignedSpecialistId === $currentUser?.id)}
              <button class="btn btn-sm btn-primary" on:click={() => startEditingAddendum(addendum)}>
                {addendum.status === 'SUBMITTED' && addendum.assignedSpecialistId === $currentUser?.id ? 'Review' : 'Edit'}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    
    {#if showEditor}
      <div class="addendum-editor-section">
        <div class="editor-header">
          <h4>{editingAddendum ? (editingAddendum.status === 'SUBMITTED' ? 'Review Addendum' : 'Edit Addendum') : 'New Addendum'}</h4>
          <button class="btn-close" on:click={cancelEditor}>×</button>
        </div>
        
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        
        <div class="reason-input">
          <label for="addendum-reason">Reason for Addendum</label>
          <input 
            id="addendum-reason"
            type="text" 
            bind:value={reason} 
            placeholder="e.g., Additional findings, Clarification, Correction"
            disabled={editingAddendum?.status === 'SUBMITTED' && editingAddendum?.assignedSpecialistId !== $currentUser?.id}
          />
        </div>
        
        <div class="editor-toolbar">
          <Tooltip text="Bold (Ctrl+B)" position="top">
            <button class="toolbar-btn" on:click={toggleBold} class:active={editor?.isActive('bold')}>
              <strong>B</strong>
            </button>
          </Tooltip>
          <Tooltip text="Italic (Ctrl+I)" position="top">
            <button class="toolbar-btn" on:click={toggleItalic} class:active={editor?.isActive('italic')}>
              <em>I</em>
            </button>
          </Tooltip>
          <Tooltip text="Underline (Ctrl+U)" position="top">
            <button class="toolbar-btn" on:click={toggleUnderline} class:active={editor?.isActive('underline')}>
              <u>U</u>
            </button>
          </Tooltip>
          <div class="toolbar-divider"></div>
          <Tooltip text="Bullet List" position="top">
            <button class="toolbar-btn" on:click={toggleBulletList} class:active={editor?.isActive('bulletList')}>
              •
            </button>
          </Tooltip>
          <Tooltip text="Numbered List" position="top">
            <button class="toolbar-btn" on:click={toggleOrderedList} class:active={editor?.isActive('orderedList')}>
              1.
            </button>
          </Tooltip>
          <div class="toolbar-divider"></div>
          <Tooltip text="Undo (Ctrl+Z)" position="top">
            <button class="toolbar-btn" on:click={undo}>↩</button>
          </Tooltip>
          <Tooltip text="Redo (Ctrl+Y)" position="top">
            <button class="toolbar-btn" on:click={redo}>↪</button>
          </Tooltip>
          
          {#if !(editingAddendum?.status === 'SUBMITTED' && editingAddendum?.assignedSpecialistId !== $currentUser?.id)}
            <div class="toolbar-divider"></div>
            <Tooltip text={isListening ? 'Stop Dictation' : 'Start Dictation'} position="top">
              <button 
                class="toolbar-btn voice-btn" 
                class:active={isListening}
                class:listening={isListening}
                on:click={toggleVoice}
                disabled={isReconnecting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            </Tooltip>
            {#if !voiceConnected && !isListening}
              <Tooltip text="Reconnect Voice Server" position="top">
                <button 
                  class="toolbar-btn reconnect-btn" 
                  on:click={connectVoice}
                  disabled={isReconnecting}
                >
                  {#if isReconnecting}
                    <span class="spinner-small"></span>
                  {:else}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M23 4v6h-6"/>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                  {/if}
                </button>
              </Tooltip>
            {/if}
          {/if}
        </div>
        
        <div class="editor-container" bind:this={editorElement}></div>
        
        <div class="editor-actions">
          {#if editingAddendum?.status === 'SUBMITTED' && editingAddendum?.assignedSpecialistId === $currentUser?.id}
            <button class="btn btn-secondary" on:click={handleReturnAddendum} disabled={isSubmitting}>
              Return to Resident
            </button>
            <button class="btn btn-success" on:click={handleSignAddendum} disabled={isSubmitting}>
              {isSubmitting ? 'Signing...' : 'Sign Addendum'}
            </button>
          {:else if editingAddendum?.status === 'SUBMITTED'}
            <div class="waiting-review-notice">
              <span class="status-icon">⏳</span>
              <span>Waiting for specialist review</span>
            </div>
          {:else if isSigner}
            <button class="btn btn-secondary" on:click={handleSaveDraft} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            <button class="btn btn-success" on:click={handleSignAddendum} disabled={isSubmitting || !editingAddendum}>
              {isSubmitting ? 'Signing...' : 'Sign & Finalize'}
            </button>
          {:else}
            <button class="btn btn-secondary" on:click={handleSaveDraft} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            <button class="btn btn-primary" on:click={openSubmitModal} disabled={isSubmitting || !editingAddendum}>
              Submit for Review
            </button>
          {/if}
        </div>
      </div>
    {:else if canAddAddendum && pendingAddendums.length === 0}
      <button class="btn btn-addendum-new" on:click={startNewAddendum}>
        <span class="icon">+</span>
        Add Addendum
      </button>
    {/if}
  </div>
{/if}

{#if showSubmitModal}
  <div class="modal-backdrop" on:click={closeSubmitModal}>
    <div class="modal-container" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Submit Addendum</h3>
        <button class="modal-close" on:click={closeSubmitModal}>×</button>
      </div>
      <div class="modal-body">
        {#if !hasSpecialistReview}
          <div class="submit-option self-sign-option">
            <p class="option-description">
              Since you signed the original report yourself, you can sign off this addendum directly.
            </p>
            <button class="btn btn-success btn-block" on:click={() => { closeSubmitModal(); handleSignAddendum(); }} disabled={isSubmitting}>
              {isSubmitting ? 'Signing...' : 'Sign Off Addendum'}
            </button>
          </div>
          
          <div class="option-divider">
            <span>OR</span>
          </div>
          
          <div class="submit-option">
            <p class="option-description">
              Optionally, submit to a specialist for review:
            </p>
            <label for="specialist-select">Select Specialist</label>
            {#if loadingSpecialists}
              <p>Loading specialists...</p>
            {:else}
              <select id="specialist-select" bind:value={selectedSpecialistId}>
                <option value="">-- Select a specialist --</option>
                {#each specialists as specialist}
                  <option value={specialist.id}>{specialist.name}{specialist.specialty ? ` - ${specialist.specialty}` : ''}</option>
                {/each}
              </select>
            {/if}
          </div>
        {:else}
          <div class="submit-option">
            <p class="option-description">
              This addendum will be submitted to the specialist who reviewed the original report.
            </p>
            <label for="specialist-select">Assigned Specialist</label>
            {#if loadingSpecialists}
              <p>Loading...</p>
            {:else}
              <select id="specialist-select" bind:value={selectedSpecialistId} disabled>
                {#each specialists as specialist}
                  {#if specialist.id === selectedSpecialistId}
                    <option value={specialist.id}>{specialist.name}{specialist.specialty ? ` - ${specialist.specialty}` : ''}</option>
                  {/if}
                {/each}
              </select>
            {/if}
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={closeSubmitModal}>Cancel</button>
        {#if hasSpecialistReview}
          <button class="btn btn-primary" on:click={handleSubmitAddendum} disabled={!selectedSpecialistId || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        {:else}
          <button class="btn btn-primary" on:click={handleSubmitAddendum} disabled={!selectedSpecialistId || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .addendum-workspace {
    border-top: 2px solid var(--primary-color, #3b82f6);
    background: var(--bg-secondary, #f8fafc);
    padding: 1rem;
    margin-top: 1rem;
  }
  
  .signed-addendums {
    margin-bottom: 1.5rem;
  }
  
  .signed-addendum-section {
    background: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-left: 4px solid #8b5cf6;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .addendum-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }
  
  .addendum-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #7c3aed;
  }
  
  .signed-by {
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
  }
  
  .addendum-reason {
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
    margin-bottom: 0.75rem;
  }
  
  .addendum-content-readonly {
    color: var(--text-primary, #1e293b);
    line-height: 1.6;
  }
  
  .addendum-content-readonly :global(p) {
    margin: 0.5em 0;
  }
  
  .pending-addendums {
    margin-bottom: 1rem;
  }
  
  .pending-addendums h4 {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
  }
  
  .pending-addendum-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .pending-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .status-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
  }
  
  .status-badge.draft {
    background: #fef3c7;
    color: #d97706;
  }
  
  .status-badge.submitted {
    background: #dbeafe;
    color: #2563eb;
  }
  
  .reason {
    color: var(--text-primary, #1e293b);
  }
  
  .addendum-editor-section {
    background: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 8px;
    padding: 1rem;
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .editor-header h4 {
    margin: 0;
    color: var(--text-primary, #1e293b);
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary, #64748b);
    line-height: 1;
  }
  
  .btn-close:hover {
    color: var(--text-primary, #1e293b);
  }
  
  .error-message {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }
  
  .reason-input {
    margin-bottom: 1rem;
  }
  
  .reason-input label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary, #64748b);
    margin-bottom: 0.25rem;
  }
  
  .reason-input input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 6px;
    font-size: 0.875rem;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1e293b);
  }
  
  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e5e7eb);
    border-bottom: none;
    border-radius: 6px 6px 0 0;
  }
  
  .toolbar-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-primary, #1e293b);
    font-size: 0.875rem;
  }
  
  .toolbar-btn:hover {
    background: var(--bg-hover, #e2e8f0);
  }
  
  .toolbar-btn.active {
    background: var(--primary-color, #3b82f6);
    color: white;
  }
  
  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--border-color, #e5e7eb);
    margin: 0 0.25rem;
  }
  
  .editor-container {
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0 0 6px 6px;
    min-height: 150px;
    max-height: 300px;
    overflow-y: auto;
    background: var(--bg-primary, #ffffff);
  }
  
  .editor-container :global(.addendum-tiptap-editor) {
    padding: 0.75rem;
    min-height: 150px;
    outline: none;
    color: var(--text-primary, #1e293b);
  }
  
  .editor-container :global(.addendum-tiptap-editor p) {
    margin: 0.5em 0;
  }
  
  .voice-btn {
    color: var(--text-secondary, #64748b);
  }
  
  .voice-btn.listening {
    background: #ef4444;
    color: white;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  .voice-btn:hover:not(.listening) {
    color: var(--primary-color, #3b82f6);
  }
  
  .reconnect-btn {
    color: var(--text-secondary, #64748b);
  }
  
  .reconnect-btn:hover {
    color: #f59e0b;
  }
  
  .spinner-small {
    width: 14px;
    height: 14px;
    border: 2px solid var(--border-color, #e5e7eb);
    border-top-color: var(--primary-color, #3b82f6);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
  }
  
  .waiting-review-notice {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #fef3c7;
    color: #92400e;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .status-icon {
    font-size: 1rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-size: 0.875rem;
  }
  
  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  .btn-primary {
    background: var(--primary-color, #3b82f6);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover, #2563eb);
  }
  
  .btn-secondary {
    background: var(--bg-secondary, #f1f5f9);
    color: var(--text-primary, #1e293b);
    border: 1px solid var(--border-color, #e5e7eb);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: var(--bg-hover, #e2e8f0);
  }
  
  .btn-success {
    background: #16a34a;
    color: white;
  }
  
  .btn-success:hover:not(:disabled) {
    background: #15803d;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-addendum-new {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #8b5cf6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    width: 100%;
    justify-content: center;
  }
  
  .btn-addendum-new:hover {
    background: #7c3aed;
  }
  
  .btn-addendum-new .icon {
    font-size: 1.25rem;
    font-weight: bold;
  }
  
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-container {
    background: var(--bg-primary, #ffffff);
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }
  
  .modal-header h3 {
    margin: 0;
    color: var(--text-primary, #1e293b);
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary, #64748b);
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-body label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-primary, #1e293b);
  }
  
  .modal-body select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 6px;
    font-size: 0.875rem;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1e293b);
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color, #e5e7eb);
  }
  
  .submit-option {
    margin-bottom: 0.5rem;
  }
  
  .self-sign-option {
    background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
    border: 1px solid #86efac;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
  }
  
  :global([data-theme="dark"]) .self-sign-option {
    background: linear-gradient(135deg, #14532d 0%, #064e3b 100%);
    border-color: #22c55e;
  }
  
  .option-description {
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
    margin: 0 0 0.75rem 0;
    line-height: 1.5;
  }
  
  .option-divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .option-divider::before,
  .option-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color, #e5e7eb);
  }
  
  .option-divider span {
    font-size: 0.75rem;
    color: var(--text-secondary, #64748b);
    text-transform: uppercase;
    font-weight: 500;
  }
  
  .btn-block {
    width: 100%;
    display: block;
  }
  
  /* Dark mode overrides */
  :global([data-theme="dark"]) .addendum-workspace {
    background: #1e293b;
    border-top-color: #6366f1;
  }
  
  :global([data-theme="dark"]) .signed-addendum-section {
    background: #0f172a;
    border-color: #334155;
  }
  
  :global([data-theme="dark"]) .addendum-header {
    border-bottom-color: #334155;
  }
  
  :global([data-theme="dark"]) .addendum-header h3 {
    color: #a78bfa;
  }
  
  :global([data-theme="dark"]) .signed-by,
  :global([data-theme="dark"]) .addendum-reason,
  :global([data-theme="dark"]) .pending-addendums h4 {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .addendum-content-readonly {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .pending-addendum-card {
    background: #0f172a;
    border-color: #334155;
  }
  
  :global([data-theme="dark"]) .reason {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .status-badge.draft {
    background: rgba(217, 119, 6, 0.2);
    color: #fbbf24;
  }
  
  :global([data-theme="dark"]) .status-badge.submitted {
    background: rgba(37, 99, 235, 0.2);
    color: #60a5fa;
  }
  
  :global([data-theme="dark"]) .addendum-editor-section {
    background: #0f172a;
    border-color: #334155;
  }
  
  :global([data-theme="dark"]) .editor-header h4 {
    color: #f1f5f9;
  }
  
  :global([data-theme="dark"]) .btn-close {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .btn-close:hover {
    color: #f1f5f9;
  }
  
  :global([data-theme="dark"]) .error-message {
    background: rgba(220, 38, 38, 0.15);
    color: #f87171;
  }
  
  :global([data-theme="dark"]) .reason-input label {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .reason-input input {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }
  
  :global([data-theme="dark"]) .editor-toolbar {
    background: #1e293b;
    border-color: #334155;
  }
  
  :global([data-theme="dark"]) .toolbar-btn {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .toolbar-btn:hover {
    background: #334155;
  }
  
  :global([data-theme="dark"]) .toolbar-divider {
    background: #334155;
  }
  
  :global([data-theme="dark"]) .editor-container {
    background: #0f172a;
    border-color: #334155;
  }
  
  :global([data-theme="dark"]) .editor-container :global(.addendum-tiptap-editor) {
    color: #f1f5f9;
  }
  
  :global([data-theme="dark"]) .voice-btn {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .reconnect-btn {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .spinner-small {
    border-color: #334155;
  }
  
  :global([data-theme="dark"]) .waiting-review-notice {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
  }
  
  :global([data-theme="dark"]) .btn-secondary {
    background: #1e293b;
    color: #e2e8f0;
    border-color: #334155;
  }
  
  :global([data-theme="dark"]) .btn-secondary:hover:not(:disabled) {
    background: #334155;
  }
  
  :global([data-theme="dark"]) .modal-container {
    background: #1e293b;
  }
  
  :global([data-theme="dark"]) .modal-header {
    border-bottom-color: #334155;
  }
  
  :global([data-theme="dark"]) .modal-header h3 {
    color: #f1f5f9;
  }
  
  :global([data-theme="dark"]) .modal-close {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .modal-body label {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .modal-body select {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }
  
  :global([data-theme="dark"]) .modal-footer {
    border-top-color: #334155;
  }
</style>
