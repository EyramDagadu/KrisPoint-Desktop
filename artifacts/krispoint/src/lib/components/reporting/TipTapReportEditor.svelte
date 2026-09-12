<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import TextAlign from '@tiptap/extension-text-align';
  import { TextStyle } from '@tiptap/extension-text-style';
  import { Color } from '@tiptap/extension-color';
  import { Table } from '@tiptap/extension-table';
  import { TableRow } from '@tiptap/extension-table-row';
  import { TableCell } from '@tiptap/extension-table-cell';
  import { TableHeader } from '@tiptap/extension-table-header';
  import { reportData, reportActions } from '../../stores/reportStore';
  import { patientData } from '../../stores/reportStore';
  import { settingsService } from '../../services/SettingsService';
  import Tooltip from '$lib/components/ui/Tooltip.svelte';
  import AIRefineButton from './AIRefineButton.svelte';
  import { hasFeature } from '../../stores/licenseStore.js';

  $: hasAIFeature = hasFeature('ai_polish');

  const dispatch = createEventDispatcher();

  export let readOnly = false;

  let editorElement;
  let editor;
  let wordCount = 0;
  
  // Table modal state
  let showTableModal = false;
  let tableRows = 3;
  let tableCols = 3;
  
  // Reactive state for table tools visibility (updated on selection change)
  let isInTable = false;
  
  // Flag to track when external content should be loaded (template load only)
  let pendingExternalContent = null;
  let lastKnownStoreContent = null;

  // Auto-save is now handled centrally in ReportWorkspace with debouncing

  // Keyboard shortcut handlers (stored so we can remove them on destroy)
  let formatTextHandler, undoHandler, redoHandler, clearFormattingHandler, insertQuickPhraseHandler;
  let keyboardShortcutService = null;

  onMount(async () => {
    // Load keyboard shortcut service and listen for events
    try {
      const { keyboardShortcutService: kss } = await import('../../services/KeyboardShortcutService.js');
      keyboardShortcutService = kss;
      
      if (kss) {
        // Define handlers
        // TipTap handles its own Ctrl+B/I/U shortcuts natively
        // This handler is only for programmatic formatting (toolbar buttons, voice commands)
        formatTextHandler = (format) => {
          if (format === 'bold') toggleBold();
          else if (format === 'italic') toggleItalic();
          else if (format === 'underline') toggleUnderline();
        };
        
        undoHandler = () => undo();
        redoHandler = () => redo();
        clearFormattingHandler = () => clearFormatting();
        
        insertQuickPhraseHandler = (phrase) => {
          if (editor && !readOnly) {
            editor.chain().focus().insertContent(phrase + ' ').run();
          }
        };
        
        // Register handlers
        kss.on('formatText', formatTextHandler);
        kss.on('undo', undoHandler);
        kss.on('redo', redoHandler);
        kss.on('clearFormatting', clearFormattingHandler);
        kss.on('insertQuickPhrase', insertQuickPhraseHandler);
      }
    } catch (error) {
      console.error('Error connecting keyboard shortcuts:', error);
    }

    // Initialize TipTap editor
    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          }
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'tiptap-table',
          },
        }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content: $reportData.content || '',
      editable: !readOnly,
      editorProps: {
        attributes: {
          class: 'tiptap-editor',
          spellcheck: 'true',
        },
      },
      onUpdate: ({ editor }) => {
        handleUpdate(editor);
        // Also update table state on content changes
        isInTable = editor.isActive('table');
      },
      onSelectionUpdate: ({ editor }) => {
        // Update table state for reactive toolbar
        isInTable = editor.isActive('table');
      },
      onTransaction: ({ editor }) => {
        // Ensure table state is always current
        isInTable = editor.isActive('table');
      },
    });
    
    console.log('✅ TipTap Editor initialized - formatting buttons ready!');

    // Auto-save is handled by ReportWorkspace with debouncing

    // Make editor globally accessible for voice service
    window.tiptapEditor = editor;
  });

  // Extract just content from store to avoid re-running on every store field change
  $: storeContent = $reportData.content || '';
  
  // CRITICAL FIX: Only update editor when content changes EXTERNALLY (template loading)
  // NOT when user is typing - that would cause paragraph compression
  // Uses storeContent (not $reportData.content) to only react to actual content changes
  $: if (editor && storeContent !== undefined) {
    // Only check editor HTML if store content actually changed from what we know
    if (storeContent !== lastKnownStoreContent) {
      const currentEditorHtml = editor.getHTML();
      
      // Only apply if store content differs from editor (external change like template load)
      if (storeContent !== currentEditorHtml) {
        // Use emitUpdate: false to prevent triggering handleUpdate and breaking the feedback loop
        editor.commands.setContent(storeContent, { emitUpdate: false });
      }
      lastKnownStoreContent = storeContent;
    }
  }

  // Reactively update editor editable state when readOnly changes
  $: if (editor && readOnly !== undefined) {
    editor.setEditable(!readOnly);
  }

  onDestroy(() => {
    // Clean up keyboard shortcut listeners
    if (keyboardShortcutService) {
      if (formatTextHandler) keyboardShortcutService.off('formatText', formatTextHandler);
      if (undoHandler) keyboardShortcutService.off('undo', undoHandler);
      if (redoHandler) keyboardShortcutService.off('redo', redoHandler);
      if (clearFormattingHandler) keyboardShortcutService.off('clearFormatting', clearFormattingHandler);
      if (insertQuickPhraseHandler) keyboardShortcutService.off('insertQuickPhrase', insertQuickPhraseHandler);
    }
    
    // Clean up editor
    if (editor) {
      editor.destroy();
    }
    window.tiptapEditor = null;
  });

  function handleUpdate(editor) {
    // Skip all updates in read-only mode
    if (readOnly) return;
    
    const html = editor.getHTML();
    
    // CRITICAL: Skip if content hasn't actually changed (breaks feedback loop)
    // This prevents the cycle: load → setContent → onUpdate → updateContent → reactive → repeat
    if (html === lastKnownStoreContent) {
      return;
    }
    
    // Safeguard: Prevent saving excessively large content (likely corruption)
    if (html.length > 500000) {
      console.error('Content too large - possible corruption detected. Skipping update.');
      return;
    }
    
    const text = editor.getText();
    
    // Update word count
    wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
    // Track this content so reactive statement knows it came from user editing
    lastKnownStoreContent = html;
    
    // Update store
    reportActions.updateContent(html);
    
    // Dispatch event for parent component to trigger debounced autosave
    dispatch('contentChange', { section: 'content', content: html });
  }

  function handleAIContentInsert(content, action = 'polish') {
    if (editor && content && !readOnly) {
      const htmlContent = convertAITextToHTML(content);
      if (action === 'impression') {
        const impressionHtml = `<p><strong>IMPRESSION:</strong></p>${htmlContent}`;
        editor.chain().focus().insertContent(impressionHtml).run();
        reportActions.updateContent(editor.getHTML());
      } else {
        editor.chain().focus().setContent(htmlContent).run();
        reportActions.updateContent(htmlContent);
      }
    }
  }

  /**
   * Convert AI-generated plain text to properly formatted HTML for TipTap
   * Handles sections, bullet points, numbered lists, and line breaks
   */
  function convertAITextToHTML(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let html = '';
    let inBulletList = false;
    let inNumberedList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is a section header
      const sectionHeaders = ['COMPARISON:', 'TECHNIQUE:', 'FINDINGS:', 'IMPRESSION:'];
      const isHeader = sectionHeaders.some(h => line.toUpperCase().startsWith(h));

      if (isHeader) {
        // Close any open lists
        if (inBulletList) {
          html += '</ul>';
          inBulletList = false;
        }
        if (inNumberedList) {
          html += '</ol>';
          inNumberedList = false;
        }

        // Add section header as bold paragraph
        html += `<p><strong>${line}</strong></p>`;
      } else if (line.match(/^[•\-\*]\s+/)) {
        // Bullet point detected
        if (inNumberedList) {
          html += '</ol>';
          inNumberedList = false;
        }
        if (!inBulletList) {
          html += '<ul>';
          inBulletList = true;
        }
        const bulletText = line.replace(/^[•\-\*]\s+/, '');
        html += `<li><p>${bulletText}</p></li>`;
      } else if (line.match(/^\d+[\.\)]\s+/)) {
        // Numbered list detected
        if (inBulletList) {
          html += '</ul>';
          inBulletList = false;
        }
        if (!inNumberedList) {
          html += '<ol>';
          inNumberedList = true;
        }
        const numberedText = line.replace(/^\d+[\.\)]\s+/, '');
        html += `<li><p>${numberedText}</p></li>`;
      } else {
        // Regular paragraph
        if (inBulletList) {
          html += '</ul>';
          inBulletList = false;
        }
        if (inNumberedList) {
          html += '</ol>';
          inNumberedList = false;
        }
        html += `<p>${line}</p>`;
      }
    }

    // Close any remaining lists
    if (inBulletList) html += '</ul>';
    if (inNumberedList) html += '</ol>';

    return html;
  }

  function handleFormatCommand(format) {
    if (!editor || readOnly) return;

    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'bullet':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'numberedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      default:
        break;
    }
  }

  // Auto-save functions removed - handled by ReportWorkspace with debouncing

  // Toolbar actions (also used by voice commands and programmatic calls)
  function toggleBold() {
    if (!editor || readOnly) return;
    editor.chain().focus().toggleBold().run();
  }

  function toggleItalic() {
    if (!editor || readOnly) return;
    editor.chain().focus().toggleItalic().run();
  }

  function toggleUnderline() {
    if (!editor || readOnly) return;
    editor.chain().focus().toggleUnderline().run();
  }

  function toggleBulletList() {
    if (!editor || readOnly) return;
    editor.chain().focus().toggleBulletList().run();
  }

  function toggleOrderedList() {
    if (!editor || readOnly) return;
    editor.chain().focus().toggleOrderedList().run();
  }

  function setTextAlign(alignment) {
    if (!editor || readOnly) return;
    editor.chain().focus().setTextAlign(alignment).run();
  }

  function setParagraph() {
    if (!editor || readOnly) return;
    editor.chain().focus().setParagraph().run();
  }

  function setHeading(level) {
    if (!editor || readOnly) return;
    editor.chain().focus().setHeading({ level }).run();
  }

  function clearFormatting() {
    if (!editor || readOnly) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  }

  function undo() {
    if (!editor || readOnly) return;
    editor.chain().focus().undo().run();
  }

  function redo() {
    if (!editor || readOnly) return;
    editor.chain().focus().redo().run();
  }

  // Table functions
  function openTableModal() {
    if (!editor || readOnly) return;
    tableRows = 3;
    tableCols = 3;
    showTableModal = true;
  }
  
  function insertTable() {
    if (!editor || readOnly) return;
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: false }).run();
    showTableModal = false;
  }
  
  function cancelTableModal() {
    showTableModal = false;
  }

  function addColumnBefore() {
    if (!editor || readOnly) return;
    editor.chain().focus().addColumnBefore().run();
  }

  function addColumnAfter() {
    if (!editor || readOnly) return;
    editor.chain().focus().addColumnAfter().run();
  }

  function deleteColumn() {
    if (!editor || readOnly) return;
    editor.chain().focus().deleteColumn().run();
  }

  function addRowBefore() {
    if (!editor || readOnly) return;
    editor.chain().focus().addRowBefore().run();
  }

  function addRowAfter() {
    if (!editor || readOnly) return;
    editor.chain().focus().addRowAfter().run();
  }

  function deleteRow() {
    if (!editor || readOnly) return;
    editor.chain().focus().deleteRow().run();
  }

  function deleteTable() {
    if (!editor || readOnly) return;
    editor.chain().focus().deleteTable().run();
    // Update table state immediately after deletion
    isInTable = false;
  }

  function mergeCells() {
    if (!editor || readOnly) return;
    editor.chain().focus().mergeCells().run();
  }

  function splitCell() {
    if (!editor || readOnly) return;
    editor.chain().focus().splitCell().run();
  }

  function toggleRedText() {
    if (!editor || readOnly) return;
    const currentColor = editor.getAttributes('textStyle').color;
    if (currentColor === '#dc2626') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor('#dc2626').run();
    }
  }

  // Export method for voice service
  export function insertText(text) {
    if (editor && !readOnly) {
      editor.chain().focus().insertContent(text).run();
    }
  }

  export function getEditor() {
    return editor;
  }
</script>

<div class="tiptap-report-editor">
  <!-- Editor Header -->
  <div class="editor-header">
    <div class="section-info">
      <h3 class="section-title">Report Workspace</h3>
    </div>

    <!-- Formatting Toolbar (hidden in read-only mode) -->
    {#if !readOnly}
    <div class="editor-toolbar">
      <!-- Basic Formatting -->
      <div class="tool-group">
        <Tooltip text="Bold text" shortcut="Ctrl+B" position="bottom">
          <button 
            class="tool-btn" 
            on:click={toggleBold}
            class:active={editor?.isActive('bold')}
          >
            <strong>B</strong>
          </button>
        </Tooltip>
        <Tooltip text="Italic text" shortcut="Ctrl+I" position="bottom">
          <button 
            class="tool-btn" 
            on:click={toggleItalic}
            class:active={editor?.isActive('italic')}
          >
            <em>I</em>
          </button>
        </Tooltip>
        <Tooltip text="Underline text" shortcut="Ctrl+U" position="bottom">
          <button 
            class="tool-btn" 
            on:click={toggleUnderline}
            class:active={editor?.isActive('underline')}
          >
            <u>U</u>
          </button>
        </Tooltip>
        <Tooltip text="Clear all formatting" position="bottom">
          <button 
            class="tool-btn" 
            on:click={clearFormatting}
          >
            🧹
          </button>
        </Tooltip>
        <Tooltip text="Red text (for emphasis)" position="bottom">
          <button 
            class="tool-btn red-text-btn" 
            on:click={toggleRedText}
            class:active={editor?.getAttributes('textStyle').color === '#dc2626'}
          >
            <span style="color: #dc2626; font-weight: bold;">A</span>
          </button>
        </Tooltip>
      </div>

      <!-- Headings -->
      <div class="tool-group">
        <Tooltip text="Normal paragraph" position="bottom">
          <button 
            class="tool-btn" 
            on:click={setParagraph}
            class:active={editor?.isActive('paragraph')}
          >
            P
          </button>
        </Tooltip>
        <Tooltip text="Large heading" position="bottom">
          <button 
            class="tool-btn" 
            on:click={() => setHeading(1)}
            class:active={editor?.isActive('heading', { level: 1 })}
          >
            H1
          </button>
        </Tooltip>
        <Tooltip text="Medium heading" position="bottom">
          <button 
            class="tool-btn" 
            on:click={() => setHeading(2)}
            class:active={editor?.isActive('heading', { level: 2 })}
          >
            H2
          </button>
        </Tooltip>
        <Tooltip text="Small heading" position="bottom">
          <button 
            class="tool-btn" 
            on:click={() => setHeading(3)}
            class:active={editor?.isActive('heading', { level: 3 })}
          >
            H3
          </button>
        </Tooltip>
      </div>

      <!-- Lists -->
      <div class="tool-group">
        <Tooltip text="Bullet list" position="bottom">
          <button 
            class="tool-btn" 
            on:click={toggleBulletList}
            class:active={editor?.isActive('bulletList')}
          >
            •
          </button>
        </Tooltip>
        <Tooltip text="Numbered list" position="bottom">
          <button 
            class="tool-btn" 
            on:click={toggleOrderedList}
            class:active={editor?.isActive('orderedList')}
          >
            1.
          </button>
        </Tooltip>
      </div>

      <!-- Alignment -->
      <div class="tool-group">
        <Tooltip text="Align left" position="bottom">
          <button 
            class="tool-btn" 
            on:click={() => setTextAlign('left')}
            class:active={editor?.isActive({ textAlign: 'left' })}
          >
            ⬅
          </button>
        </Tooltip>
        <Tooltip text="Center align" position="bottom">
          <button 
            class="tool-btn" 
            on:click={() => setTextAlign('center')}
            class:active={editor?.isActive({ textAlign: 'center' })}
          >
            ⬌
          </button>
        </Tooltip>
        <Tooltip text="Align right" position="bottom">
          <button 
            class="tool-btn" 
            on:click={() => setTextAlign('right')}
            class:active={editor?.isActive({ textAlign: 'right' })}
          >
            ➡
          </button>
        </Tooltip>
      </div>

      <!-- Tables -->
      <div class="tool-group table-group">
        <Tooltip text="Insert table" position="bottom">
          <button 
            class="tool-btn" 
            on:click={openTableModal}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="14" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <line x1="1" y1="6" x2="15" y2="6" stroke="currentColor" stroke-width="1.5"/>
              <line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="1.5"/>
              <line x1="6" y1="1" x2="6" y2="15" stroke="currentColor" stroke-width="1.5"/>
              <line x1="11" y1="1" x2="11" y2="15" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </Tooltip>
        {#if isInTable}
          <Tooltip text="Add column after" position="bottom">
            <button class="tool-btn" on:click={addColumnAfter}>+Col</button>
          </Tooltip>
          <Tooltip text="Add row after" position="bottom">
            <button class="tool-btn" on:click={addRowAfter}>+Row</button>
          </Tooltip>
          <Tooltip text="Delete column" position="bottom">
            <button class="tool-btn danger" on:click={deleteColumn}>-Col</button>
          </Tooltip>
          <Tooltip text="Delete row" position="bottom">
            <button class="tool-btn danger" on:click={deleteRow}>-Row</button>
          </Tooltip>
          <Tooltip text="Delete table" position="bottom">
            <button class="tool-btn danger" on:click={deleteTable}>🗑️</button>
          </Tooltip>
        {/if}
      </div>

      <!-- Undo/Redo -->
      <div class="tool-group">
        <Tooltip text="Undo last action" shortcut="Ctrl+Z" position="bottom">
          <button 
            class="tool-btn" 
            on:click={undo}
          >
            ↶
          </button>
        </Tooltip>
        <Tooltip text="Redo last action" shortcut="Ctrl+Y" position="bottom">
          <button 
            class="tool-btn" 
            on:click={redo}
          >
            ↷
          </button>
        </Tooltip>
      </div>

      <!-- AI Refine -->
      <div class="tool-group ai-group">
        {#if hasAIFeature}
          <AIRefineButton 
            reportContent={$reportData.content}
            indication={$patientData.indication}
            modality={$patientData.examType}
            bodyRegion={$patientData.examSubtype}
            activeTemplateId={$reportData.activeTemplateId}
            activeTemplateName={$reportData.activeTemplateName}
            {readOnly}
            onReportGenerated={handleAIContentInsert}
          />
        {:else}
          <Tooltip text="AI Polish requires Premium license">
            <button class="tool-btn ai-locked" disabled>
              <span class="lock-icon">Locked</span>
              AI Polish
            </button>
          </Tooltip>
        {/if}
      </div>
    </div>
    {/if}
  </div>

  <!-- Editor Content -->
  <div class="editor-container">
    <div bind:this={editorElement} class="editor-content"></div>
  </div>
</div>

<!-- Table Size Modal -->
{#if showTableModal}
  <div class="table-modal-backdrop" on:click={cancelTableModal}>
    <div class="table-modal" on:click|stopPropagation>
      <div class="table-modal-header">
        <h3>Insert Table</h3>
        <button class="modal-close-btn" on:click={cancelTableModal}>×</button>
      </div>
      <div class="table-modal-body">
        <div class="table-size-inputs">
          <div class="size-input-group">
            <label for="table-rows">Rows</label>
            <input 
              type="number" 
              id="table-rows" 
              bind:value={tableRows} 
              min="1" 
              max="20"
            />
          </div>
          <div class="size-input-group">
            <label for="table-cols">Columns</label>
            <input 
              type="number" 
              id="table-cols" 
              bind:value={tableCols} 
              min="1" 
              max="10"
            />
          </div>
        </div>
        <div class="table-preview">
          <p class="preview-label">Preview: {tableRows} × {tableCols} table</p>
          <div class="preview-grid" style="grid-template-columns: repeat({Math.min(tableCols, 5)}, 1fr); grid-template-rows: repeat({Math.min(tableRows, 4)}, 1fr);">
            {#each Array(Math.min(tableRows, 4) * Math.min(tableCols, 5)) as _, i}
              <div class="preview-cell"></div>
            {/each}
          </div>
        </div>
      </div>
      <div class="table-modal-footer">
        <button class="btn-cancel" on:click={cancelTableModal}>Cancel</button>
        <button class="btn-insert" on:click={insertTable}>Insert Table</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .tiptap-report-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-surface, #1e293b);
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: var(--color-surface-2, #273449);
    border-bottom: 1px solid var(--color-border, #475569);
    flex-wrap: wrap;
    gap: 1rem;
  }

  .section-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .section-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text, #f1f5f9);
  }

  .editor-toolbar {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .tool-group {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: var(--color-surface, #1e293b);
    border-radius: 0.375rem;
    border: 1px solid var(--color-border, #475569);
  }

  .tool-btn {
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted, #94a3b8);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
  }

  .tool-btn:hover {
    background: var(--color-surface-2, #273449);
    color: var(--color-text, #f1f5f9);
  }

  .tool-btn.active {
    background: var(--color-primary, #3b82f6);
    color: #ffffff;
  }

  .tool-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .font-size-select {
    padding: 0.5rem 0.75rem;
    background: var(--color-surface, #1e293b);
    border: 1px solid var(--color-border, #475569);
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted, #94a3b8);
    transition: all 0.2s;
    outline: none;
  }

  .font-size-select:hover {
    border-color: var(--color-primary, #3b82f6);
    background: var(--color-surface-2, #273449);
  }

  .font-size-select:focus {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .editor-container {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .editor-content {
    min-height: 100%;
  }

  /* TipTap Editor Styles */
  :global(.tiptap-editor) {
    outline: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-text-primary, #1e293b);
  }

  /* Remove ALL top spacing from editor and first element */
  :global(.tiptap-editor),
  :global(.ProseMirror) {
    padding-top: 0 !important;
    margin-top: 0 !important;
  }

  /* Headings */
  :global(.tiptap-editor h1),
  :global(.tiptap-editor h2),
  :global(.tiptap-editor h3) {
    margin-top: 1em;
    margin-bottom: 0.25em;
    font-weight: bold;
  }

  /* Remove top margin from first element to prevent leading space */
  :global(.tiptap-editor > :first-child),
  :global(.ProseMirror > :first-child),
  :global(.tiptap-editor h1:first-child),
  :global(.tiptap-editor h2:first-child),
  :global(.tiptap-editor h3:first-child),
  :global(.tiptap-editor p:first-child) {
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  :global(.tiptap-editor h1) {
    font-size: 2em;
  }

  :global(.tiptap-editor h2) {
    font-size: 1.5em;
  }

  :global(.tiptap-editor h3) {
    font-size: 1.17em;
  }

  /* Paragraphs */
  :global(.tiptap-editor p) {
    margin-top: 0.25em;
    margin-bottom: 0.5em;
    line-height: 1.5;
  }

  :global(.tiptap-editor strong) {
    font-weight: 700;
  }

  :global(.tiptap-editor em) {
    font-style: italic;
  }

  :global(.tiptap-editor u) {
    text-decoration: underline;
  }

  :global(.tiptap-editor ul),
  :global(.tiptap-editor ol) {
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  :global(.tiptap-editor li) {
    margin: 0.25rem 0;
  }

  /* Multi-level bullet list styling - matches PDF output */
  :global(.tiptap-editor ul) {
    list-style-type: disc; /* Parent level: • (filled circle) */
  }

  :global(.tiptap-editor ul ul) {
    list-style-type: circle; /* First sub-level: ○ (white circle) */
  }

  :global(.tiptap-editor ul ul ul) {
    list-style-type: square; /* Deeper levels: ▪ (small square) */
  }

  /* Multi-level numbered list styling */
  :global(.tiptap-editor ol) {
    list-style-type: decimal; /* Parent level: 1, 2, 3... */
  }

  :global(.tiptap-editor ol ol) {
    list-style-type: lower-alpha; /* First sub-level: a, b, c... */
  }

  :global(.tiptap-editor ol ol ol) {
    list-style-type: lower-roman; /* Deeper levels: i, ii, iii... */
  }

  :global(.tiptap-editor [data-text-align="left"]) {
    text-align: left;
  }

  :global(.tiptap-editor [data-text-align="center"]) {
    text-align: center;
  }

  :global(.tiptap-editor [data-text-align="right"]) {
    text-align: right;
  }

  .ai-group {
    padding: 0;
  }

  .tool-btn.danger {
    color: #ef4444;
  }

  .tool-btn.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }

  /* Table styling in editor */
  :global(.tiptap-editor table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    table-layout: fixed;
  }

  :global(.tiptap-editor th),
  :global(.tiptap-editor td) {
    border: 1px solid var(--color-border, #475569);
    padding: 0.5rem 0.75rem;
    text-align: left;
    vertical-align: top;
    min-width: 50px;
  }

  :global(.tiptap-editor th),
  :global(.tiptap-editor td) {
    background: transparent;
  }

  :global(.tiptap-editor .selectedCell) {
    background: rgba(59, 130, 246, 0.2);
    outline: 2px solid var(--color-primary, #3b82f6);
  }

  :global(.tiptap-editor .column-resize-handle) {
    position: absolute;
    right: -2px;
    top: 0;
    bottom: -2px;
    width: 4px;
    background-color: var(--color-primary, #3b82f6);
    cursor: col-resize;
    pointer-events: auto;
  }

  :global(.tableWrapper) {
    padding: 1rem 0;
    overflow-x: auto;
  }

  :global(.resize-cursor) {
    cursor: col-resize;
  }

  /* Table Modal Styles */
  .table-modal-backdrop {
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

  .table-modal {
    background: var(--color-surface, #1e293b);
    border-radius: 0.75rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    width: 100%;
    max-width: 360px;
    overflow: hidden;
    border: 1px solid var(--color-border, #475569);
  }

  .table-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: var(--color-surface-2, #273449);
    border-bottom: 1px solid var(--color-border, #475569);
  }

  .table-modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text, #f1f5f9);
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: var(--color-text-muted, #94a3b8);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  .modal-close-btn:hover {
    color: var(--color-text, #f1f5f9);
  }

  .table-modal-body {
    padding: 1.25rem;
  }

  .table-size-inputs {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .size-input-group {
    flex: 1;
  }

  .size-input-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted, #94a3b8);
    margin-bottom: 0.5rem;
  }

  .size-input-group input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    background: var(--color-background, #0f172a);
    border: 1px solid var(--color-border, #475569);
    border-radius: 0.5rem;
    color: var(--color-text, #f1f5f9);
    font-size: 1rem;
    text-align: center;
  }

  .size-input-group input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  /* Number input spinner styling - always visible */
  .size-input-group input[type="number"]::-webkit-inner-spin-button,
  .size-input-group input[type="number"]::-webkit-outer-spin-button {
    opacity: 1;
    background: var(--color-surface-2, #273449);
    border-left: 1px solid var(--color-border, #475569);
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

  .table-preview {
    text-align: center;
  }

  .preview-label {
    font-size: 0.875rem;
    color: var(--color-text-muted, #94a3b8);
    margin: 0 0 0.75rem 0;
  }

  .preview-grid {
    display: grid;
    gap: 2px;
    max-width: 200px;
    margin: 0 auto;
  }

  .preview-cell {
    aspect-ratio: 1.5;
    background: var(--color-border, #475569);
    border: 1px solid var(--color-surface, #1e293b);
    border-radius: 2px;
    min-height: 16px;
  }

  /* Light mode support for table modal */
  :global([data-theme="light"]) .table-modal {
    background: #ffffff;
    border-color: #e2e8f0;
  }

  :global([data-theme="light"]) .table-modal-header {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  :global([data-theme="light"]) .table-modal-header h3 {
    color: #1e293b;
  }

  :global([data-theme="light"]) .modal-close-btn {
    color: #64748b;
  }

  :global([data-theme="light"]) .modal-close-btn:hover {
    color: #1e293b;
  }

  :global([data-theme="light"]) .size-input-group label {
    color: #64748b;
  }

  :global([data-theme="light"]) .size-input-group input {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #1e293b;
  }

  :global([data-theme="light"]) .size-input-group input:focus {
    border-color: #3b82f6;
  }

  :global([data-theme="light"]) .size-input-group input[type="number"]::-webkit-inner-spin-button,
  :global([data-theme="light"]) .size-input-group input[type="number"]::-webkit-outer-spin-button {
    background: #e2e8f0;
    border-left: 1px solid #cbd5e1;
  }

  :global([data-theme="light"]) .preview-label {
    color: #64748b;
  }

  :global([data-theme="light"]) .preview-cell {
    background: #cbd5e1;
    border-color: #ffffff;
  }

  :global([data-theme="light"]) .table-modal-footer {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  :global([data-theme="light"]) .btn-cancel {
    color: #1e293b;
    border-color: #cbd5e1;
  }

  :global([data-theme="light"]) .btn-cancel:hover {
    background: #f1f5f9;
  }

  .table-modal-footer {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: var(--color-surface-2, #273449);
    border-top: 1px solid var(--color-border, #475569);
  }

  .btn-cancel {
    flex: 1;
    padding: 0.625rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border, #475569);
    border-radius: 0.5rem;
    color: var(--color-text, #f1f5f9);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-cancel:hover {
    background: var(--color-surface, #1e293b);
    border-color: var(--color-text-muted, #94a3b8);
  }

  .btn-insert {
    flex: 1;
    padding: 0.625rem 1rem;
    background: var(--color-primary, #3b82f6);
    border: none;
    border-radius: 0.5rem;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-insert:hover {
    background: var(--color-primary-hover, #2563eb);
  }
</style>
