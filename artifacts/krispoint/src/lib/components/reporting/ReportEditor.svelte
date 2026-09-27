<!-- src/lib/components/reporting/ReportEditor.svelte -->
<script>
  import { onMount } from 'svelte';
  import { reportData, reportActions, uiState } from '$lib/stores/reportStore.js';
  
  export let section = 'findings';
  export let content = '';
  export let onSave = () => {};
  
  let editorElement;
  let isDirty = false;
  
  const sections = {
    comparison: 'COMPARISON',
    technique: 'TECHNIQUE', 
    findings: 'FINDINGS',
    impression: 'IMPRESSION'
  };
  
  // Generate full report text with section headers
  $: fullReport = Object.entries(sections).map(([key, title]) => {
    const sectionContent = $reportData[key] || '';
    return `${title}:\n${sectionContent}\n`;
  }).join('\n');
  
  function handleInput(event) {
    const text = event.target.value;
    parseSections(text);
    isDirty = true;
  }
  
  function parseSections(text) {
    // Simple parser to extract sections from text
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent = [];
    const parsedSections = {};
    
    for (const line of lines) {
      const sectionMatch = line.match(/^([A-Z]+):$/);
      if (sectionMatch) {
        // Save previous section
        if (currentSection) {
          parsedSections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
        }
        // Start new section
        currentSection = sectionMatch[1];
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }
    
    // Save the last section
    if (currentSection) {
      parsedSections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
    }
    
    // Update store with parsed sections
    Object.entries(parsedSections).forEach(([sectionKey, content]) => {
      reportActions.updateSection(sectionKey, content);
    });
  }
  
  function saveReport() {
    onSave();
    isDirty = false;
  }
  
  function insertSectionHeader(sectionKey) {
    const header = `\n\n${sections[sectionKey].toUpperCase()}:\n`;
    if (editorElement) {
      const start = editorElement.selectionStart;
      const text = editorElement.value;
      const newText = text.slice(0, start) + header + text.slice(start);
      editorElement.value = newText;
      editorElement.focus();
      editorElement.setSelectionRange(start + header.length, start + header.length);
      parseSections(newText);
    }
  }
</script>

<div class="report-editor">
  <!-- Editor Header -->
  <div class="editor-header">
    <div class="section-tabs">
      {#each Object.entries(sections) as [key, title]}
        <button
          class="tab {key === section ? 'active' : ''}"
          on:click={() => $uiState.currentSection = key}
        >
          {title}
        </button>
      {/each}
    </div>
    
    <div class="editor-actions">
      <button class="btn btn-primary" on:click={saveReport}>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M4 3.5h10l2 2v11H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5"/><path d="M6 3.8v4h7v-4M6 16.5v-5h8v5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        Save
      </button>
    </div>
  </div>

  <!-- Main Editor -->
  <div class="editor-container">
    <textarea
      bind:this={editorElement}
      value={fullReport}
      on:input={handleInput}
      placeholder="COMPARISON:\n[Enter comparison information]\n\nTECHNIQUE:\n[Enter technique details]\n\nFINDINGS:\n[Describe findings]\n\nIMPRESSION:\n[Provide impression]"
      class="report-textarea"
      spellcheck="true"
    ></textarea>
  </div>

  <!-- Quick Insert Buttons -->
  <div class="quick-insert">
    {#each Object.entries(sections) as [key, title]}
      <button class="insert-btn" on:click={() => insertSectionHeader(key)}>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        {title}
      </button>
    {/each}
  </div>
</div>

<style>
  .report-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }
  
  .section-tabs {
    display: flex;
    gap: 0.5rem;
  }
  
  .tab {
    padding: 0.5rem 1rem;
    border: 1px solid #dee2e6;
    background: white;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .tab.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .editor-container {
    flex: 1;
    padding: 0;
  }
  
  .report-textarea {
    width: 100%;
    height: 100%;
    border: none;
    padding: 1rem;
    font-family: 'Courier New', monospace;
    font-size: 0.95rem;
    line-height: 1.5;
    resize: none;
    outline: none;
  }
  
  .quick-insert {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;
  }
  
  .insert-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid #dee2e6;
    background: white;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.85rem;
  }
  
  .insert-btn:hover {
    background: #e9ecef;
  }
  .btn-primary, .insert-btn { display: inline-flex; align-items: center; gap: .4rem; }
  .btn-primary svg, .insert-btn svg { width: 1rem; height: 1rem; }
  .report-editor { background: var(--color-surface, #fff); color: var(--color-text-primary, #1e293b); }
  .editor-header { background: var(--color-background-secondary, #f8fafc); border-color: var(--color-border, #dbe2ea); }
  .report-textarea { background: var(--color-surface, #fff); color: var(--color-text-primary, #1e293b); border-color: var(--color-border, #cbd5e1); }
  :global(:focus-visible) { outline: 3px solid var(--color-primary, #3b82f6); outline-offset: 2px; }
  :global([data-theme="dark"]) .report-editor, :global([data-theme="dark"]) .report-textarea { background: var(--color-surface, #1e293b); color: var(--color-text-primary, #f1f5f9); }
  :global([data-theme="dark"]) .editor-header { background: var(--color-background-secondary, #0f172a); border-color: var(--color-border, #475569); }
  @media (max-width: 640px) { .editor-header { align-items: flex-start; flex-direction: column; gap: .75rem; } .section-tabs { max-width: 100%; overflow-x: auto; } .quick-insert { flex-wrap: wrap; } }
</style>