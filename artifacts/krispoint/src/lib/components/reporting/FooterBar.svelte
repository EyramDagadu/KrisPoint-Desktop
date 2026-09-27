<!-- Updated FooterBar.svelte -->
<script>
  export let isSaved = true;
  export let lastSaveTime = null;
  export let wordCount = 0;
  
  function handleSave() {
    dispatchEvent(new CustomEvent('save'));
  }
  
  function handleNewReport() {
    dispatchEvent(new CustomEvent('newReport'));
  }
</script>

<div class="footer-bar">
  <div class="status-info">
    <span class="status {isSaved ? 'saved' : 'unsaved'}">
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">{#if isSaved}<path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>{:else}<circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.5"/>{/if}</svg>
      {isSaved ? 'Saved' : 'Unsaved'}
    </span>
    {#if lastSaveTime}
      <span class="save-time">
        Last save: {lastSaveTime.toLocaleTimeString()}
      </span>
    {/if}
  </div>
  
  <div class="word-count">
    {wordCount} words
  </div>
  
  <div class="footer-actions">
    <button class="btn btn-outline" on:click={handleNewReport}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M5 3.5h7l3 3v10H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 3.8v3h3" stroke="currentColor" stroke-width="1.5"/></svg>
      New Report
    </button>
    <button class="btn btn-primary" on:click={handleSave}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M4 3.5h10l2 2v11H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5"/><path d="M6 3.8v4h7v-4M6 16.5v-5h8v5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
      Save Report
    </button>
  </div>
</div>

<style>
  /* ... keep your existing styles, just add to footer-actions ... */
  .footer-actions {
    display: flex;
    gap: 0.5rem;
  }
  .footer-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; padding: .75rem 1rem; background: var(--color-surface, #fff); color: var(--color-text-primary, #1e293b); border-top: 1px solid var(--color-border, #dbe2ea); }
  .footer-actions .btn { display: inline-flex; align-items: center; gap: .4rem; min-height: 40px; }
  .footer-actions svg, .status svg { width: 1rem; height: 1rem; }
  .status { display: inline-flex; align-items: center; gap: .35rem; }
  :global(:focus-visible) { outline: 3px solid var(--color-primary, #3b82f6); outline-offset: 2px; }
  @media (max-width: 560px) { .footer-bar { align-items: stretch; flex-direction: column; } .footer-actions .btn { flex: 1; } }
</style>