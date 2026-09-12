<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let samples = [];
  let loading = true;
  let error = null;
  let total = 0;
  let offset = 0;
  let limit = 20;
  let speakers = [];
  let selectedSpeaker = '';
  let reviewStatus = 'unreviewed';
  let usabilityStatus = '';
  let dateFilter = '';
  let currentIndex = 0;
  let editingTranscript = '';
  let audioElement = null;
  let playingSampleId = null;
  
  let canReviewTraining = false;
  let canExportTraining = false;

  $: currentSample = samples[currentIndex] || null;
  $: hasNext = currentIndex < samples.length - 1;
  $: hasPrev = currentIndex > 0;

  onMount(async () => {
    let hasPermission = false;
    
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.permissions) {
          hasPermission = data.permissions.includes('training.review') || data.permissions.includes('training.read');
          canReviewTraining = hasPermission;
          canExportTraining = data.permissions.includes('training.export');
        }
      }
    } catch (e) {
      console.error('Failed to check permissions');
    }

    if (!hasPermission) {
      goto('/');
      return;
    }

    await loadSamples();
    setupKeyboardShortcuts();
  });

  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }

  function handleKeyDown(e) {
    if (!currentSample) return;
    
    const isEditing = document.activeElement?.tagName === 'TEXTAREA';
    
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveAndNext();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      markUnusable();
    } else if (e.key === 'ArrowRight' && !isEditing) {
      e.preventDefault();
      nextSample();
    } else if (e.key === 'ArrowLeft' && !isEditing) {
      e.preventDefault();
      prevSample();
    } else if (e.key === ' ' && !isEditing) {
      e.preventDefault();
      togglePlayback();
    }
  }

  async function loadSamples() {
    loading = true;
    error = null;

    try {
      let url = `/api/voice-training/samples?limit=${limit}&offset=${offset}`;
      if (selectedSpeaker) {
        url += `&speakerId=${selectedSpeaker}`;
      }
      if (reviewStatus) {
        url += `&reviewed=${reviewStatus}`;
      }
      if (usabilityStatus) {
        url += `&usable=${usabilityStatus}`;
      }
      if (dateFilter) {
        url += `&dateFilter=${dateFilter}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load samples');
      }

      const data = await response.json();
      samples = data.samples || [];
      total = data.total || 0;
      currentIndex = 0;

      const firstSample = samples[0];
      if (firstSample) {
        // Only pre-fill with verifiedTranscript if one exists - don't auto-copy rawTranscript
        editingTranscript = firstSample.verifiedTranscript || '';
      } else {
        editingTranscript = '';
      }

      const speakerSet = new Set();
      samples.forEach(s => {
        if (s.userId && s.speakerName) {
          speakerSet.add(JSON.stringify({ id: s.userId, name: s.speakerName }));
        }
      });
      speakers = Array.from(speakerSet).map(s => JSON.parse(s));

    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function formatDuration(ms) {
    if (!ms) return '0s';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatQuality(sample) {
    const parts = [];
    if (sample.avgVolume) parts.push(`Vol: ${sample.avgVolume.toFixed(0)}`);
    if (sample.silencePercent != null) parts.push(`Silence: ${(sample.silencePercent * 100).toFixed(0)}%`);
    return parts.join(' | ') || 'N/A';
  }

  async function togglePlayback() {
    if (!currentSample) return;
    
    if (playingSampleId === currentSample.id) {
      audioElement?.pause();
      playingSampleId = null;
      return;
    }

    try {
      const response = await fetch(`/api/voice-training/audio/${currentSample.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (!audioElement) {
        audioElement = new Audio();
        audioElement.onended = () => {
          playingSampleId = null;
        };
      }

      audioElement.src = url;
      audioElement.play();
      playingSampleId = currentSample.id;

    } catch (err) {
      console.error('Error playing audio:', err);
      error = 'Failed to play audio';
    }
  }

  function selectSample(index) {
    currentIndex = index;
    const sample = samples[index];
    if (sample) {
      // Only pre-fill with verifiedTranscript if one exists - don't auto-copy rawTranscript
      editingTranscript = sample.verifiedTranscript || '';
    }
    if (playingSampleId) {
      audioElement?.pause();
      playingSampleId = null;
    }
  }

  async function nextSample() {
    if (hasNext) {
      selectSample(currentIndex + 1);
    } else if (offset + limit < total) {
      offset += limit;
      await loadSamples();
    } else {
      // Reached end, reload to check for any remaining unreviewed samples
      offset = 0;
      await loadSamples();
    }
  }

  function prevSample() {
    if (hasPrev) {
      selectSample(currentIndex - 1);
    } else if (offset > 0) {
      offset = Math.max(0, offset - limit);
      loadSamples().then(() => {
        const lastIndex = samples.length - 1;
        currentIndex = lastIndex;
        const sample = samples[lastIndex];
        if (sample) {
          // Only pre-fill with verifiedTranscript if one exists
          editingTranscript = sample.verifiedTranscript || '';
        }
      });
    }
  }

  async function saveAndNext() {
    if (!currentSample) return;

    try {
      const response = await fetch(`/api/voice-training/samples/${currentSample.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verifiedTranscript: editingTranscript,
          isReviewed: true,
          isUsable: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      samples[currentIndex] = {
        ...samples[currentIndex],
        verifiedTranscript: editingTranscript,
        isReviewed: true,
        isUsable: true
      };
      samples = [...samples];

      nextSample();

    } catch (err) {
      error = err.message;
    }
  }

  async function markUnusable() {
    if (!currentSample) return;

    try {
      const response = await fetch(`/api/voice-training/samples/${currentSample.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isUsable: false,
          isReviewed: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      samples[currentIndex] = { ...samples[currentIndex], isUsable: false, isReviewed: true };
      samples = [...samples];

      nextSample();

    } catch (err) {
      error = err.message;
    }
  }

  async function deleteSample() {
    if (!currentSample) return;
    if (!confirm('Delete this sample? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/voice-training/samples/${currentSample.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      samples = samples.filter((_, i) => i !== currentIndex);
      total--;
      if (currentIndex >= samples.length) {
        currentIndex = Math.max(0, samples.length - 1);
      }
      if (currentSample) {
        // Only pre-fill with verifiedTranscript if one exists
        editingTranscript = currentSample.verifiedTranscript || '';
      }

    } catch (err) {
      error = err.message;
    }
  }

  async function bulkMarkUsable(usable) {
    const action = usable ? 'mark_all_usable' : 'mark_all_unusable';
    const filterText = selectedSpeaker ? 'selected speaker' : 'all samples';
    const confirmMsg = usable 
      ? `Mark ${filterText} as usable?` 
      : `Mark ${filterText} as unusable?`;

    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch('/api/voice-training/samples', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          speakerId: selectedSpeaker || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      await loadSamples();
    } catch (err) {
      error = err.message;
    }
  }

  async function exportKaldiFormat() {
    try {
      const response = await fetch('/api/voice-training/export', {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'training_data.zip';
      a.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      error = err.message;
    }
  }
</script>

<svelte:head>
  <title>Voice Training Data - KrisPoint Admin</title>
</svelte:head>

<div class="training-data-page">

  {#if error}
    <div class="error-banner">
      {error}
      <button class="dismiss-btn" on:click={() => error = null}>Dismiss</button>
    </div>
  {/if}

  <div class="controls-bar">
    <div class="filters">
      <label>
        Status:
        <select bind:value={reviewStatus} on:change={loadSamples}>
          <option value="">All</option>
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </label>
      <label>
        Usability:
        <select bind:value={usabilityStatus} on:change={loadSamples}>
          <option value="">All</option>
          <option value="usable">Usable</option>
          <option value="unusable">Unusable</option>
        </select>
      </label>
      <label>
        Date:
        <select bind:value={dateFilter} on:change={loadSamples}>
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </label>
      <label>
        Speaker:
        <select bind:value={selectedSpeaker} on:change={loadSamples}>
          <option value="">All Speakers</option>
          {#each speakers as speaker}
            <option value={speaker.id}>{speaker.name}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="actions">
      <select class="bulk-action-select" on:change={(e) => { if (e.target.value) { bulkMarkUsable(e.target.value === 'usable'); e.target.value = ''; }}} disabled={loading}>
        <option value="">Bulk Actions...</option>
        <option value="usable">Mark All Usable</option>
        <option value="unusable">Mark All Unusable</option>
      </select>
      <button class="btn-secondary" on:click={loadSamples} disabled={loading}>
        Refresh
      </button>
      {#if canExportTraining}
        <button class="btn-primary" on:click={exportKaldiFormat}>
          Export for Training
        </button>
      {/if}
    </div>
  </div>

  <div class="stats-bar">
    <span>Total: {total}</span>
    <span>Current: {currentIndex + 1} of {samples.length}</span>
  </div>

  <div class="shortcuts-hint">
    <span><kbd>Space</kbd> Play/Pause</span>
    <span><kbd>Ctrl+Enter</kbd> Save & Next</span>
    <span><kbd>Esc</kbd> Mark Unusable</span>
    <span><kbd>←</kbd><kbd>→</kbd> Navigate</span>
  </div>

  {#if loading}
    <div class="loading">Loading samples...</div>
  {:else if samples.length === 0}
    <div class="empty-state">
      <p>No training samples found.</p>
      <p class="hint">Samples are collected when users opt-in to contribute their dictation data.</p>
    </div>
  {:else}
    <div class="review-layout">
      <aside class="sample-list">
        {#each samples as sample, i}
          <button 
            class="sample-item" 
            class:active={i === currentIndex}
            class:reviewed={sample.isReviewed}
            class:unusable={!sample.isUsable}
            on:click={() => selectSample(i)}
          >
            <span class="sample-num">#{offset + i + 1}</span>
            <span class="sample-speaker">Dr {sample.speakerName?.split(' ').pop() || '?'}</span>
            <span class="sample-duration">{formatDuration(sample.audioDuration)}</span>
            {#if sample.isReviewed}
              <span class="status-dot reviewed" title="Reviewed"></span>
            {/if}
            {#if !sample.isUsable}
              <span class="status-dot unusable" title="Unusable"></span>
            {/if}
          </button>
        {/each}
      </aside>

      <main class="review-panel">
        {#if currentSample}
          <div class="sample-header">
            <div class="sample-info">
              <span class="speaker">Dr {currentSample.speakerName?.split(' ').pop() || 'Unknown'}</span>
              <span class="date">{formatDate(currentSample.createdAt)}</span>
              {#if currentSample.reportType}
                <span class="report-type">{currentSample.reportType}</span>
              {/if}
            </div>
            <div class="sample-meta">
              <span>{formatDuration(currentSample.audioDuration)}</span>
              <span>{currentSample.wordCount || 0} words</span>
              <span>{formatQuality(currentSample)}</span>
            </div>
          </div>

          <div class="audio-controls">
            <button class="btn-play" on:click={togglePlayback}>
              {playingSampleId === currentSample.id ? '⏹ Stop' : '▶ Play Audio'}
            </button>
          </div>

          <div class="transcript-section">
            <label>ASR Output (what Whisper heard):</label>
            <p class="transcript raw">{currentSample.rawTranscript}</p>
            <button class="btn-copy-asr" on:click={() => editingTranscript = currentSample.rawTranscript || ''}>
              Copy to Verified ↓
            </button>
          </div>

          <div class="transcript-section">
            <label>Verified Transcript (type what was actually said):</label>
            <textarea 
              bind:value={editingTranscript} 
              rows="5"
              placeholder="Type the correct transcript here..."
            ></textarea>
          </div>

          <div class="action-buttons">
            <button class="btn-danger" on:click={markUnusable}>
              Mark Unusable (Esc)
            </button>
            <button class="btn-delete" on:click={deleteSample}>
              Delete
            </button>
            <div class="spacer"></div>
            <button class="btn-secondary" on:click={prevSample} disabled={!hasPrev && offset === 0}>
              ← Previous
            </button>
            <button class="btn-primary btn-large" on:click={saveAndNext}>
              Save & Next (Ctrl+Enter)
            </button>
          </div>
        {/if}
      </main>
    </div>
  {/if}
</div>

<style>
  .training-data-page {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    height: calc(100vh - 4rem);
    display: flex;
    flex-direction: column;
  }

  .error-banner {
    background: #ef4444;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dismiss-btn {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .controls-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .filters {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .filters label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #6b7280);
  }

  .filters select {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1f2937);
    border: 1px solid var(--color-border, #d1d5db);
    cursor: pointer;
    font-size: 0.875rem;
  }

  .filters select:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .bulk-action-select {
    padding: 0.5rem 0.75rem;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #6b7280);
    cursor: pointer;
  }

  .bulk-action-select:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
  }

  .btn-primary, .btn-secondary, .btn-danger, .btn-delete {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: var(--color-primary, #3b82f6);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover, #2563eb);
  }

  .btn-secondary {
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1f2937);
    border: 1px solid var(--color-border, #d1d5db);
  }

  .btn-secondary:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }

  .btn-danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  .btn-delete {
    background: transparent;
    color: var(--color-text-secondary, #6b7280);
    border: 1px solid var(--color-border, #d1d5db);
  }

  .btn-delete:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }

  .btn-large {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  .btn-copy-asr {
    margin-top: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-primary, #3b82f6);
    border: 1px solid var(--color-primary, #3b82f6);
    border-radius: 6px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-copy-asr:hover {
    background: var(--color-primary, #3b82f6);
    color: white;
  }

  .stats-bar {
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    display: flex;
    gap: 1.5rem;
  }

  .shortcuts-hint {
    display: flex;
    gap: 1.5rem;
    font-size: 0.75rem;
    color: var(--color-text-secondary, #6b7280);
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .shortcuts-hint kbd {
    background: var(--color-surface-hover, #f3f4f6);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
    border: 1px solid var(--color-border, #d1d5db);
  }

  .loading, .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--color-text-secondary, #6b7280);
  }

  .hint {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .review-layout {
    display: flex;
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
  }

  .sample-list {
    width: 240px;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 8px;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .sample-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    color: var(--color-text-primary, #1f2937);
    cursor: pointer;
    text-align: left;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    font-size: 0.875rem;
    transition: background 0.15s ease;
  }

  .sample-item:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }

  .sample-item.active {
    background: var(--color-primary, #3b82f6);
  }

  .sample-item.unusable {
    opacity: 0.5;
  }

  .sample-num {
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.75rem;
  }

  .sample-speaker {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sample-duration {
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.75rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status-dot.reviewed {
    background: #22c55e;
  }

  .status-dot.unusable {
    background: #ef4444;
  }

  .review-panel {
    flex: 1;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    overflow-y: auto;
  }

  .sample-header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .sample-info {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .speaker {
    font-weight: 600;
    color: var(--color-primary, #3b82f6);
    font-size: 1.1rem;
  }

  .date, .report-type {
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.875rem;
  }

  .report-type {
    background: var(--color-surface-hover, #f3f4f6);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--color-border, #e5e7eb);
  }

  .sample-meta {
    display: flex;
    gap: 1rem;
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.875rem;
  }

  .audio-controls {
    display: flex;
    gap: 0.5rem;
  }

  .btn-play {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #d1d5db);
    color: var(--color-text-primary, #1f2937);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .btn-play:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }

  .transcript-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .transcript-section label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  .transcript {
    margin: 0;
    padding: 1rem;
    background: var(--color-surface-hover, #f3f4f6);
    border-radius: 8px;
    font-size: 0.95rem;
    line-height: 1.6;
    border-left: 3px solid var(--color-text-secondary, #9ca3af);
    color: var(--color-text-primary, #1f2937);
  }

  .transcript-section textarea {
    width: 100%;
    padding: 1rem;
    background: var(--color-surface, #ffffff);
    border: 2px solid var(--color-primary, #3b82f6);
    border-radius: 8px;
    color: var(--color-text-primary, #1f2937);
    font-size: 0.95rem;
    line-height: 1.6;
    resize: vertical;
    min-height: 100px;
  }

  .transcript-section textarea:focus {
    outline: none;
    border-color: var(--color-primary-hover, #2563eb);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .action-buttons {
    display: flex;
    gap: 0.75rem;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
    flex-wrap: wrap;
  }

  .spacer {
    flex: 1;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
