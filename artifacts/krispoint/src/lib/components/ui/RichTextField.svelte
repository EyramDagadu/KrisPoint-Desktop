<!-- Rich Text Field Component for Template Editing -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { sanitizeHTML } from '$lib/utils/htmlSanitizer.js';

  // Props
  export let value = '';
  export let placeholder = '';
  export let rows = 3;
  export let label = '';
  export let required = false;
  export let showTableButton = false;

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Local state
  let editor;
  let isEditorReady = false;
  let lastValue = '';
  
  // Table modal state
  let showTableModal = false;
  let tableRows = 3;
  let tableCols = 3;

  // Initialize editor
  onMount(() => {
    if (editor) {
      // Set initial content - sanitize for security
      const sanitizedValue = sanitizeHTML(value || '');
      editor.innerHTML = sanitizedValue;
      lastValue = sanitizedValue;
      isEditorReady = true;
      
      // Focus event
      editor.addEventListener('focus', () => {
        if (editor.innerHTML === '' && placeholder) {
          editor.classList.add('has-placeholder');
        }
      });
      
      // Blur event
      editor.addEventListener('blur', () => {
        editor.classList.remove('has-placeholder');
        handleInput();
      });
      
      // Input event for real-time changes
      editor.addEventListener('input', handleInput);
      
      // Keyboard shortcuts
      editor.addEventListener('keydown', handleKeydown);
    }
  });

  // Handle input changes
  function handleInput() {
    if (!editor || !isEditorReady) return;
    
    const sanitizedContent = sanitizeHTML(editor.innerHTML);
    
    // Only update if content changed
    if (sanitizedContent !== lastValue) {
      lastValue = sanitizedContent;
      value = sanitizedContent;
      dispatch('input', { value: sanitizedContent });
    }
  }

  // Handle keyboard shortcuts
  function handleKeydown(event) {
    if (!event.ctrlKey && !event.metaKey) return;
    
    switch (event.key.toLowerCase()) {
      case 'b':
        event.preventDefault();
        execCommand('bold');
        break;
      case 'i':
        event.preventDefault();
        execCommand('italic');
        break;
      case 'u':
        event.preventDefault();
        execCommand('underline');
        break;
      case 'z':
        event.preventDefault();
        if (event.shiftKey) {
          execCommand('redo');
        } else {
          execCommand('undo');
        }
        break;
      case 'y':
        event.preventDefault();
        execCommand('redo');
        break;
    }
  }

  // Execute formatting command
  function execCommand(command, value = null) {
    if (!editor) return;
    
    editor.focus();
    document.execCommand(command, false, value);
    handleInput();
  }

  // Toolbar button handlers
  function toggleBold() {
    execCommand('bold');
  }

  function toggleItalic() {
    execCommand('italic');
  }

  function toggleUnderline() {
    execCommand('underline');
  }

  function insertUnorderedList() {
    execCommand('insertUnorderedList');
  }

  function insertOrderedList() {
    execCommand('insertOrderedList');
  }

  function openTableModal() {
    tableRows = 3;
    tableCols = 3;
    showTableModal = true;
  }
  
  function closeTableModal() {
    showTableModal = false;
  }
  
  function insertTable() {
    if (!editor) return;
    
    editor.focus();
    
    // Generate table rows HTML - no extra whitespace
    let rowsHtml = '';
    for (let r = 0; r < tableRows; r++) {
      let cellsHtml = '';
      for (let c = 0; c < tableCols; c++) {
        cellsHtml += '<td style="border: 1px solid #475569; padding: 0.5rem;">&nbsp;</td>';
      }
      rowsHtml += '<tr>' + cellsHtml + '</tr>';
    }
    
    // Clean table HTML without extra whitespace or trailing paragraph
    const tableHTML = '<table class="rtf-table" style="width: 100%; border-collapse: collapse; margin: 0.25rem 0;"><tbody>' + rowsHtml + '</tbody></table>';
    document.execCommand('insertHTML', false, tableHTML);
    handleInput();
    closeTableModal();
  }

  function undo() {
    execCommand('undo');
  }

  function redo() {
    execCommand('redo');
  }

  // Update editor content when value prop changes externally
  $: if (editor && isEditorReady && value !== lastValue) {
    const sanitizedValue = sanitizeHTML(value || '');
    editor.innerHTML = sanitizedValue;
    lastValue = sanitizedValue;
  }
</script>

<div class="rich-text-field">
  {#if label}
    <label for="rich-editor" class="field-label">
      {label}
      {#if required}<span class="required">*</span>{/if}
    </label>
  {/if}
  
  <div class="editor-container">
    <!-- Formatting Toolbar -->
    <div class="toolbar">
      <button
        type="button"
        class="toolbar-btn"
        on:click={toggleBold}
        title="Bold (Ctrl+B)"
        aria-label="Bold"
      >
        <strong>B</strong>
      </button>
      
      <button
        type="button"
        class="toolbar-btn"
        on:click={toggleItalic}
        title="Italic (Ctrl+I)"
        aria-label="Italic"
      >
        <em>I</em>
      </button>
      
      <button
        type="button"
        class="toolbar-btn"
        on:click={toggleUnderline}
        title="Underline (Ctrl+U)"
        aria-label="Underline"
      >
        <u>U</u>
      </button>
      
      <div class="toolbar-separator"></div>
      
      <button
        type="button"
        class="toolbar-btn"
        on:click={insertUnorderedList}
        title="Bullet List"
        aria-label="Bullet List"
      >
        ●
      </button>
      
      <button
        type="button"
        class="toolbar-btn"
        on:click={insertOrderedList}
        title="Numbered List"
        aria-label="Numbered List"
      >
        1.
      </button>
      
      {#if showTableButton}
        <div class="toolbar-separator"></div>
        
        <button
          type="button"
          class="toolbar-btn"
          on:click={openTableModal}
          title="Insert Table"
          aria-label="Insert Table"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="14" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <line x1="1" y1="6" x2="15" y2="6" stroke="currentColor" stroke-width="1.5"/>
            <line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="1.5"/>
            <line x1="6" y1="1" x2="6" y2="15" stroke="currentColor" stroke-width="1.5"/>
            <line x1="11" y1="1" x2="11" y2="15" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      {/if}
      
      <div class="toolbar-separator"></div>
      
      <button
        type="button"
        class="toolbar-btn"
        on:click={undo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        ↶
      </button>
      
      <button
        type="button"
        class="toolbar-btn"
        on:click={redo}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        ↷
      </button>
    </div>
    
    <!-- Editor -->
    <div
      bind:this={editor}
      class="rich-editor"
      class:has-placeholder={!value && placeholder}
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      aria-label={label || 'Rich text editor'}
      style="min-height: {rows * 1.5}rem;"
      data-placeholder={placeholder}
    ></div>
  </div>
</div>

<!-- Table Size Modal -->
{#if showTableModal}
  <div class="table-modal-overlay" on:click={closeTableModal}>
    <div class="table-modal" on:click|stopPropagation>
      <div class="table-modal-header">
        <h4>Insert Table</h4>
        <button class="table-modal-close" on:click={closeTableModal}>×</button>
      </div>
      <div class="table-modal-body">
        <div class="table-size-inputs">
          <div class="size-input-group">
            <label for="table-rows">Rows</label>
            <input 
              id="table-rows"
              type="number" 
              min="1" 
              max="20" 
              bind:value={tableRows}
            />
          </div>
          <div class="size-input-group">
            <label for="table-cols">Columns</label>
            <input 
              id="table-cols"
              type="number" 
              min="1" 
              max="10" 
              bind:value={tableCols}
            />
          </div>
        </div>
        <div class="table-preview-grid">
          {#each Array(Math.min(tableRows, 4)) as _, r}
            <div class="table-preview-row">
              {#each Array(Math.min(tableCols, 5)) as _, c}
                <div class="table-preview-cell"></div>
              {/each}
              {#if tableCols > 5}
                <div class="table-preview-more">...</div>
              {/if}
            </div>
          {/each}
          {#if tableRows > 4}
            <div class="table-preview-more-rows">...</div>
          {/if}
        </div>
        <p class="table-size-label">{tableRows} × {tableCols} table</p>
      </div>
      <div class="table-modal-footer">
        <button class="table-btn-cancel" on:click={closeTableModal}>Cancel</button>
        <button class="table-btn-insert" on:click={insertTable}>Insert Table</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .rich-text-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field-label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .required {
    color: #dc2626;
    margin-left: 0.25rem;
  }

  .editor-container {
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: #ffffff;
    overflow: hidden;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }

  .editor-container:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
    transition: background-color 0.15s ease-in-out;
  }

  .toolbar-btn:hover {
    background: #e5e7eb;
  }

  .toolbar-btn:active {
    background: #d1d5db;
  }

  .toolbar-separator {
    width: 1px;
    height: 1.5rem;
    background: #d1d5db;
    margin: 0 0.25rem;
  }

  .rich-editor {
    padding: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.6;
    color: #1f2937;
    outline: none;
    overflow-y: auto;
    max-height: 12rem;
  }

  .rich-editor.has-placeholder:empty::before {
    content: attr(data-placeholder);
    color: #9ca3af;
    pointer-events: none;
  }

  .rich-editor:empty {
    min-height: 1.5rem;
  }

  /* Style the formatted content */
  .rich-editor :global(b),
  .rich-editor :global(strong) {
    font-weight: 600;
  }

  .rich-editor :global(i),
  .rich-editor :global(em) {
    font-style: italic;
  }

  .rich-editor :global(u) {
    text-decoration: underline;
  }

  .rich-editor :global(ul),
  .rich-editor :global(ol) {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .rich-editor :global(li) {
    margin: 0.25rem 0;
  }

  .rich-editor :global(p) {
    margin: 0.5rem 0;
  }

  .rich-editor :global(p:first-child) {
    margin-top: 0;
  }

  .rich-editor :global(p:last-child) {
    margin-bottom: 0;
  }

  /* Dark theme support */
  :global([data-theme="dark"]) .field-label {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .editor-container {
    border-color: #334155;
    background: #0f172a;
  }

  :global([data-theme="dark"]) .editor-container:focus-within {
    border-color: #3b82f6;
  }

  :global([data-theme="dark"]) .toolbar {
    background: #1e293b;
    border-bottom-color: #334155;
  }

  :global([data-theme="dark"]) .toolbar-btn {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .toolbar-btn:hover {
    background: #334155;
  }

  :global([data-theme="dark"]) .toolbar-btn:active {
    background: #475569;
  }

  :global([data-theme="dark"]) .toolbar-separator {
    background: #334155;
  }

  :global([data-theme="dark"]) .rich-editor {
    color: #f1f5f9;
    background: #0f172a;
  }

  :global([data-theme="dark"]) .rich-editor.has-placeholder:empty::before {
    color: #64748b;
  }

  /* Table Modal Styles */
  .table-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .table-modal {
    background: var(--color-surface, #1e293b);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: 320px;
    max-width: 90vw;
    border: 1px solid var(--color-border, #334155);
  }

  .table-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-border, #334155);
  }

  .table-modal-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text, #f1f5f9);
  }

  .table-modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-secondary, #94a3b8);
    line-height: 1;
    padding: 0;
  }

  .table-modal-close:hover {
    color: var(--color-text, #f1f5f9);
  }

  .table-modal-body {
    padding: 1.25rem;
  }

  .table-size-inputs {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .size-input-group {
    flex: 1;
  }

  .size-input-group label {
    display: block;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #94a3b8);
    margin-bottom: 0.5rem;
  }

  .size-input-group input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #334155);
    border-radius: 6px;
    background: var(--color-bg, #0f172a);
    color: var(--color-text, #f1f5f9);
    font-size: 1rem;
  }

  .size-input-group input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  /* Number input spinner styling - always visible */
  .size-input-group input[type="number"]::-webkit-inner-spin-button,
  .size-input-group input[type="number"]::-webkit-outer-spin-button {
    opacity: 1;
    background: #e2e8f0;
    border-left: 1px solid #cbd5e1;
    cursor: pointer;
  }

  .size-input-group input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .size-input-group input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: inner-spin-button;
    appearance: auto;
  }

  .table-preview-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg, #0f172a);
    border-radius: 6px;
    border: 1px solid var(--color-border, #334155);
  }

  .table-preview-row {
    display: flex;
    gap: 2px;
  }

  .table-preview-cell {
    width: 24px;
    height: 18px;
    background: var(--color-surface, #1e293b);
    border: 1px solid var(--color-border, #475569);
    border-radius: 2px;
  }

  .table-preview-more,
  .table-preview-more-rows {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary, #64748b);
    font-size: 0.75rem;
    padding: 0 4px;
  }

  .table-size-label {
    text-align: center;
    color: var(--color-text-secondary, #94a3b8);
    font-size: 0.875rem;
    margin: 0;
  }

  .table-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--color-border, #334155);
  }

  .table-btn-cancel,
  .table-btn-insert {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .table-btn-cancel {
    background: transparent;
    border: 1px solid var(--color-border, #475569);
    color: var(--color-text, #f1f5f9);
  }

  .table-btn-cancel:hover {
    background: var(--color-surface-hover, #334155);
  }

  .table-btn-insert {
    background: var(--color-primary, #3b82f6);
    border: none;
    color: white;
  }

  .table-btn-insert:hover {
    background: var(--color-primary-hover, #2563eb);
  }

  /* Light mode is the default for this component - fix modal for light mode */
  .table-modal {
    background: #ffffff;
    border-color: #e2e8f0;
  }

  .table-modal-header {
    border-color: #e2e8f0;
  }

  .table-modal-header h4 {
    color: #1e293b;
  }

  .table-modal-close {
    color: #64748b;
  }

  .table-modal-close:hover {
    color: #1e293b;
  }

  .size-input-group label {
    color: #64748b;
  }

  .size-input-group input {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #1e293b;
  }

  .table-preview-grid {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  .table-preview-cell {
    background: #cbd5e1;
    border-color: #ffffff;
  }

  .table-preview-more,
  .table-preview-more-rows {
    color: #64748b;
  }

  .table-size-label {
    color: #64748b;
  }

  .table-modal-footer {
    border-color: #e2e8f0;
  }

  .table-btn-cancel {
    color: #1e293b;
    border-color: #cbd5e1;
    background: transparent;
  }

  .table-btn-cancel:hover {
    background: #f1f5f9;
  }

  /* Dark mode overrides for the modal */
  :global([data-theme="dark"]) .table-modal {
    background: #1e293b;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .table-modal-header {
    border-color: #334155;
  }

  :global([data-theme="dark"]) .table-modal-header h4 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .table-modal-close {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .table-modal-close:hover {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .size-input-group label {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .size-input-group input {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .size-input-group input[type="number"]::-webkit-inner-spin-button,
  :global([data-theme="dark"]) .size-input-group input[type="number"]::-webkit-outer-spin-button {
    background: #273449;
    border-left: 1px solid #475569;
  }

  :global([data-theme="dark"]) .table-preview-grid {
    background: #0f172a;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .table-preview-cell {
    background: #334155;
    border-color: #1e293b;
  }

  :global([data-theme="dark"]) .table-preview-more,
  :global([data-theme="dark"]) .table-preview-more-rows {
    color: #64748b;
  }

  :global([data-theme="dark"]) .table-size-label {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .table-modal-footer {
    border-color: #334155;
  }

  :global([data-theme="dark"]) .table-btn-cancel {
    color: #f1f5f9;
    border-color: #475569;
  }

  :global([data-theme="dark"]) .table-btn-cancel:hover {
    background: #334155;
  }
</style>