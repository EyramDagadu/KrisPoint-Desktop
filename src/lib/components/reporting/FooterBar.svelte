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
      {isSaved ? '✓ Saved' : '● Unsaved'}
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
      📄 New Report
    </button>
    <button class="btn btn-primary" on:click={handleSave}>
      💾 Save Report
    </button>
  </div>
</div>

<style>
  /* ... keep your existing styles, just add to footer-actions ... */
  .footer-actions {
    display: flex;
    gap: 0.5rem;
  }
</style>