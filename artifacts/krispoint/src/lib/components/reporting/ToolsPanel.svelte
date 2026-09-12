<!-- src/lib/components/reporting/ToolsPanel.svelte -->
<script>
import { uiState, reportData, reportActions, patientData } from "$lib/stores/reportStore";
  import { macroStore } from "$lib/stores/macroStore.js";
  import { hasFeature } from '$lib/stores/licenseStore.js';
  import { isSoloEdition } from '$lib/config/edition.js';

  $: hasTemplateAccess = hasFeature('templates');
  $: hasMacroAccess = hasFeature('macros');
  
  export let currentSection = 'findings';
  export let editorComponent = null;
  export let readOnly = false;
  

  let showTemplateDropdown = false;
  let showMacroDropdown = false;
  let templateSearchTerm = '';
  let macroSearchTerm = '';
  
  // Independent scope for each dropdown
  let templateScope = 'system';
  let macroScope = 'system';
  
  let allTemplates = [];
  let availableMacros = [];
  let templatesLoading = false;
  let macrosLoading = false;

  // Filter templates based on search
  $: filteredTemplates = allTemplates.filter(template => {
    const searchLower = templateSearchTerm.toLowerCase();
    return (template.name && template.name.toLowerCase().includes(searchLower)) ||
           (template.category && template.category.toLowerCase().includes(searchLower)) ||
           (template.modality && template.modality.toLowerCase().includes(searchLower)) ||
           (template.bodyRegion && template.bodyRegion.toLowerCase().includes(searchLower)) ||
           (template.content && template.content.toLowerCase().includes(searchLower));
  });
  
  // Filter macros based on search
  $: filteredMacros = availableMacros.filter(macro =>
    (macro.name && macro.name.toLowerCase().includes(macroSearchTerm.toLowerCase())) ||
    (macro.category && macro.category.toLowerCase().includes(macroSearchTerm.toLowerCase())) ||
    (macro.content && macro.content.toLowerCase().includes(macroSearchTerm.toLowerCase()))
  );
  
  import { onMount } from 'svelte';
  onMount(async () => {
    // Load saved scope preferences first
    await loadSavedScopes();
    await loadTemplates();
    await loadMacros();
  });
  
  async function loadSavedScopes() {
    if (isSoloEdition) {
      templateScope = 'all';
      macroScope = 'all';
      return;
    }
    try {
      const res = await fetch('/api/user-settings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          templateScope = data.settings.templateScope || 'system';
          macroScope = data.settings.macroScope || 'system';
        }
      }
    } catch (error) {
      console.error('Error loading saved scopes:', error);
    }
  }

  // Request counters to handle race conditions
  let templateRequestId = 0;
  let macroRequestId = 0;

  async function loadTemplates() {
    templatesLoading = true;
    const requestId = ++templateRequestId;
    const scopeAtRequest = templateScope;
    
    try {
      const res = await fetch(isSoloEdition ? '/api/templates' : `/api/templates?scope=${scopeAtRequest}`, {
        credentials: 'include'
      });

      // Only apply results if this is still the latest request and scope hasn't changed
      if (requestId !== templateRequestId || scopeAtRequest !== templateScope) return;

      if (res.ok) {
        const data = await res.json();
        allTemplates = data.success ? data.templates : [];
      }
    } catch (error) {
      if (requestId === templateRequestId) {
        console.error('Error loading templates:', error);
        allTemplates = [];
      }
    } finally {
      if (requestId === templateRequestId) {
        templatesLoading = false;
      }
    }
  }

  async function loadMacros() {
    macrosLoading = true;
    const requestId = ++macroRequestId;
    const scopeAtRequest = macroScope;
    
    try {
      const res = await fetch(isSoloEdition ? '/api/macros' : `/api/macros?scope=${scopeAtRequest}`, {
        credentials: 'include'
      });

      // Only apply results if this is still the latest request and scope hasn't changed
      if (requestId !== macroRequestId || scopeAtRequest !== macroScope) return;

      if (res.ok) {
        const data = await res.json();
        availableMacros = data.success ? data.macros : [];
      }
    } catch (error) {
      if (requestId === macroRequestId) {
        console.error('Error loading macros:', error);
        availableMacros = [];
      }
    } finally {
      if (requestId === macroRequestId) {
        macrosLoading = false;
      }
    }
  }

  async function switchTemplateScope(scope) {
    if (templateScope === scope) return;
    templateScope = scope;
    
    // Save preference to user settings (for voice commands)
    try {
      await fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ templateScope: scope })
      });
    } catch (error) {
      console.error('Error saving template scope preference:', error);
    }
    
    await loadTemplates();
  }

  async function switchMacroScope(scope) {
    if (macroScope === scope) return;
    macroScope = scope;
    
    // Save preference to user settings (for voice commands)
    try {
      await fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ macroScope: scope })
      });
    } catch (error) {
      console.error('Error saving macro scope preference:', error);
    }
    
    await loadMacros();
  }

  function insertTemplate(template) {
    try {
      // Keep the exact selected template attached to the draft, including
      // personal/system template IDs and the display name at selection time.
      reportActions.setActiveTemplate(template);

      // Template content is stored as HTML in the database
      let htmlContent = template.content || '';
      
      // Check if content is already HTML (contains HTML tags)
      const isHtml = /<[a-z][\s\S]*>/i.test(htmlContent);
      
      if (!isHtml && htmlContent) {
        // Content is plain text - convert newlines to HTML paragraphs
        const paragraphs = htmlContent.split(/\n\n+/).filter(p => p.trim());
        htmlContent = paragraphs.map(p => {
          const formattedContent = p.trim().replace(/\n/g, '<br>');
          return `<p>${formattedContent}</p>`;
        }).join('');
      }
      
      // Add consistent spacing between sections
      htmlContent = formatSectionSpacing(htmlContent);
      
      // Remove any leading empty paragraphs
      htmlContent = htmlContent.trim();
      htmlContent = htmlContent.replace(/^(<p><\/p>)+/gi, '');
      htmlContent = htmlContent.replace(/^(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>)+/gi, '');
      
      // Check if editor has meaningful content
      const existingContent = $reportData.content || '';
      const hasContent = existingContent.replace(/<p><\/p>|<p>\s*<\/p>|<p><br\s*\/?><\/p>/gi, '').trim().length > 0;
      
      if (hasContent) {
        // Insert at cursor position
        insertAtCursorAsHtml(htmlContent);
      } else {
        // Editor is empty - use setContent to replace everything (including empty paragraph)
        if (editorComponent) {
          const editor = editorComponent.getEditor();
          if (editor) {
            editor.chain().focus().setContent(htmlContent).run();
          }
        }
        reportActions.updateContent(htmlContent);
      }
      showTemplateDropdown = false;
    } catch (error) {
      console.error("Error applying template:", error);
      showTemplateDropdown = false;
    }
  }
  
  /**
   * Ensure consistent spacing between report sections
   * Parse content, find sections, rebuild with exactly one blank line between sections
   */
  function formatSectionSpacing(content) {
    if (!content) return '';
    
    const sectionHeaders = ['COMPARISON:', 'TECHNIQUE:', 'FINDINGS:', 'IMPRESSION:', 'RECOMMENDATIONS:'];
    
    // Find all section positions
    const sections = [];
    for (const header of sectionHeaders) {
      const marker = `<strong>${header}</strong>`;
      const pos = content.indexOf(marker);
      if (pos !== -1) {
        sections.push({ header, pos, marker });
      }
    }
    
    if (sections.length === 0) return content;
    
    // Sort by position
    sections.sort((a, b) => a.pos - b.pos);
    
    // For each section after the first, ensure exactly one empty line before it
    let result = content;
    
    // Process from last to first to preserve positions
    for (let i = sections.length - 1; i > 0; i--) {
      const section = sections[i];
      const sectionStart = result.indexOf(section.marker);
      
      // Find the <p> that contains this section header
      const pTagStart = result.lastIndexOf('<p>', sectionStart);
      if (pTagStart === -1) continue;
      
      // Get everything before this <p> tag
      const beforeSection = result.substring(0, pTagStart);
      const afterAndSection = result.substring(pTagStart);
      
      // Remove any trailing whitespace/newlines and empty paragraphs from beforeSection
      let cleaned = beforeSection.replace(/(\s|<p><\/p>|<p>\s*<\/p>)*$/g, '');
      
      // Add exactly one empty paragraph for spacing
      result = cleaned + '<p></p>' + afterAndSection;
    }
    
    return result;
  }

  function toggleTemplateDropdown() {
    showTemplateDropdown = !showTemplateDropdown;
    showMacroDropdown = false;
    if (!showTemplateDropdown) {
      templateSearchTerm = '';
    }
  }
  
  function toggleMacroDropdown() {
    showMacroDropdown = !showMacroDropdown;
    showTemplateDropdown = false;
    if (!showMacroDropdown) {
      macroSearchTerm = '';
    }
  }
  
  function insertStoredMacro(macro) {
    // Process macro content with current patient data
    let processedContent = macroStore.processContent(macro.content, {
      TIMEFRAME: '6 months',
      PATIENT_NAME: $patientData.name || 'Patient',
      EXAM_TYPE: $patientData.examType || 'study',
      BODY_REGION: $patientData.examSubtype || 'region'
    });
    
    // Insert at cursor position instead of appending
    insertAtCursor(processedContent);
    showMacroDropdown = false;
  }

  function insertAtCursor(text) {
    // Use TipTap editor's insertText function if available
    if (editorComponent && editorComponent.insertText) {
      editorComponent.insertText(text);
    } else {
      // Fallback to old method
      const editor = document.querySelector('.report-editor');
      if (editor) {
        editor.focus();
        document.execCommand('insertText', false, text);
      }
    }
  }

  function insertAtCursorAsHtml(html) {
    // Insert HTML content into TipTap editor
    if (editorComponent) {
      const editor = editorComponent.getEditor();
      if (editor) {
        editor.chain().focus().insertContent(html).run();
      }
    }
  }
  
  // Radiology-specific macros organized by section
  const macrosBySection = {
    comparison: [
      { label: 'Compared to prior', text: 'Compared to prior {study} from {date}.' },
      { label: 'No prior studies', text: 'No prior studies available for comparison.' }
    ],
    technique: [
      { label: 'CT Technique', text: 'Axial images were obtained through the {region} without intravenous contrast.' },
      { label: 'MRI Technique', text: 'Multiplanar, multisequence MRI images were obtained through the {region}.' }
    ],
    findings: [
      { label: 'Normal Lungs', text: 'Lungs: Clear without focal consolidation, nodule, or effusion.' },
      { label: 'Normal Heart', text: 'Heart: Normal in size and configuration. No pericardial effusion.' },
      { label: 'Normal Bones', text: 'Bones: No acute fracture or destructive lesion identified.' }
    ],
    impression: [
      { label: 'No Acute Findings', text: 'No acute cardiopulmonary process.' },
      { label: 'Clinical Correlation', text: 'Clinical correlation is recommended.' },
      { label: 'Follow-up', text: 'Follow-up as clinically indicated.' }
    ]
  };
  
  function insertMacro(macroText) {
    // Replace placeholders with appropriate values
    let text = macroText;
    text = text.replace('{study}', $patientData.examType || 'study');
    text = text.replace('{date}', new Date().toLocaleDateString());
    text = text.replace('{region}', $patientData.examSubtype || 'region');
    
    // Insert the macro
    reportActions.appendContent(text);
  }
</script>

<aside class="tools-panel">
  {#if readOnly}
    <div class="panel-section read-only-panel">
      <h3>View Only Mode</h3>
      <p class="read-only-notice">Editing tools are disabled in view-only mode.</p>
    </div>
  {:else}
  <div class="panel-section">
    <h3>Quick Insert</h3>
    
    <!-- Template Dropdown -->
    <div class="template-section">
      {#if hasTemplateAccess}
      <button 
        class="template-dropdown-btn" 
        on:click={toggleTemplateDropdown}
        title="Insert complete report template"
      >
        <span class="btn-content">
          📝 Templates
        </span>
        <span class="dropdown-arrow" class:open={showTemplateDropdown}>▼</span>
      </button>
      
      {#if showTemplateDropdown}
        <div class="template-dropdown">
          {#if !isSoloEdition}
          <div class="scope-toggle">
            <button 
              class="scope-btn {templateScope === 'system' ? 'active' : ''}"
              on:click={(e) => { e.stopPropagation(); switchTemplateScope('system'); }}
            >
              System
            </button>
            <button 
              class="scope-btn {templateScope === 'personal' ? 'active' : ''}"
              on:click={(e) => { e.stopPropagation(); switchTemplateScope('personal'); }}
            >
              Personal
            </button>
          </div>
          {/if}
          <div class="search-box">
            <input 
              type="text" 
              placeholder="🔍 Search templates..." 
              bind:value={templateSearchTerm}
              class="search-input"
              on:click={(e) => e.stopPropagation()}
            />
          </div>
          <div class="dropdown-items">
            {#if templatesLoading}
              <div class="empty-state">
                <div class="empty-icon">⏳</div>
                <div class="empty-text">Loading...</div>
              </div>
            {:else if filteredTemplates.length > 0}
              {#each filteredTemplates as template}
                <button 
                  class="template-option"
                  on:click={() => insertTemplate(template)}
                >
                  <div class="template-name">{template.name}</div>
                  <div class="template-desc">{template.category || template.modality || ''}</div>
                </button>
              {/each}
            {:else}
              <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-text">{isSoloEdition ? 'No templates found' : `No ${templateScope} templates found`}</div>
                <div class="empty-hint">{isSoloEdition ? 'Create templates in the Templates page' : templateScope === 'personal' ? 'Create personal templates in Templates page' : 'System templates are managed by admins'}</div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      {:else}
      <button class="template-dropdown-btn locked-btn" disabled title="Premium feature - upgrade to access templates">
        <span class="btn-content">🔒 Templates</span>
        <span class="premium-badge">Premium</span>
      </button>
      {/if}
    </div>

    <!-- Macro Dropdown -->
    <div class="macro-section">
      {#if hasMacroAccess}
      <button 
        class="macro-dropdown-btn" 
        on:click={toggleMacroDropdown}
        title="Insert saved macro"
      >
        <span class="btn-content">
          🔖 Macros
        </span>
        <span class="dropdown-arrow" class:open={showMacroDropdown}>▼</span>
      </button>
      
      {#if showMacroDropdown}
        <div class="macro-dropdown">
          {#if !isSoloEdition}
          <div class="scope-toggle">
            <button 
              class="scope-btn {macroScope === 'system' ? 'active' : ''}"
              on:click={(e) => { e.stopPropagation(); switchMacroScope('system'); }}
            >
              System
            </button>
            <button 
              class="scope-btn {macroScope === 'personal' ? 'active' : ''}"
              on:click={(e) => { e.stopPropagation(); switchMacroScope('personal'); }}
            >
              Personal
            </button>
          </div>
          {/if}
          <div class="search-box">
            <input 
              type="text" 
              placeholder="🔍 Search macros..." 
              bind:value={macroSearchTerm}
              class="search-input"
              on:click={(e) => e.stopPropagation()}
            />
          </div>
          <div class="dropdown-items">
            {#if macrosLoading}
              <div class="empty-state">
                <div class="empty-icon">⏳</div>
                <div class="empty-text">Loading...</div>
              </div>
            {:else if filteredMacros.length > 0}
              {#each filteredMacros as macro}
                <button 
                  class="macro-option"
                  on:click={() => insertStoredMacro(macro)}
                >
                  <div class="macro-name">{macro.name}</div>
                  <div class="macro-desc">{macro.category}</div>
                </button>
              {/each}
            {:else}
              <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-text">No {macroScope} macros found</div>
                <div class="empty-hint">{macroScope === 'personal' ? 'Create personal macros in Macros page' : 'System macros are managed by admins'}</div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      {:else}
      <button class="macro-dropdown-btn locked-btn" disabled title="Premium feature - upgrade to access macros">
        <span class="btn-content">🔒 Macros</span>
        <span class="premium-badge">Premium</span>
      </button>
      {/if}
    </div>
  </div>
  {/if}
</aside>

<style>
  .tools-panel {
    padding: 1rem;
    overflow: visible; /* Allow dropdowns to extend beyond panel boundaries */
  }

  .read-only-panel {
    text-align: center;
    padding: 1rem;
  }

  .read-only-notice {
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
    margin: 0;
  }
  
  .panel-section {
    margin-bottom: 1.5rem;
  }
  
  .panel-section h3 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: var(--color-text-primary, #2c3e50);
    font-weight: 600;
    border-bottom: 1px solid var(--color-border, #e9ecef);
    padding-bottom: 0.5rem;
  }
  
  .macros-list, .phrases-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .macro-btn, .phrase-btn {
  }

  /* Dropdown sections */
  .template-section, .macro-section {
    margin-bottom: 1rem;
    position: relative;
  }

  /* Scope toggle inside dropdowns */
  .scope-toggle {
    display: flex;
    padding: 0.5rem;
    gap: 0.25rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-surface, #f9fafb);
  }

  .scope-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    background: var(--color-background, #ffffff);
    color: var(--color-text-secondary, #64748b);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .scope-btn:hover:not(.active) {
    background: var(--color-surface-hover, #f3f4f6);
  }

  .scope-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .template-dropdown-btn, .macro-dropdown-btn {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #3b82f6;
    border-radius: 0.5rem;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
  }

  .locked-btn {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    border-color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .locked-btn:hover {
    transform: none;
  }

  .premium-badge {
    font-size: 0.7rem;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.15rem 0.5rem;
    border-radius: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .template-dropdown-btn:hover:not(.locked-btn) {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    transform: translateY(-1px);
  }

  .dropdown-arrow {
    transition: transform 0.2s;
  }

  .dropdown-arrow.open {
    transform: rotate(180deg);
  }

  .template-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    margin-top: 0.25rem;
    overflow: hidden;
  }

  .search-box {
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-surface, #ffffff);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    background: var(--color-background, #f9fafb);
    color: var(--color-text-primary, #1f2937);
    font-size: 0.875rem;
    outline: none;
    transition: all 0.2s;
  }

  .search-input:focus {
    border-color: #3b82f6;
    background: var(--color-surface, #ffffff);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .dropdown-items {
    max-height: 250px;
    overflow-y: auto;
  }

  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-text-muted, #6b7280);
  }

  .empty-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .empty-hint {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .template-option {
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: var(--color-surface, #ffffff);
    text-align: left;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid var(--color-border-light, #f3f4f6);
  }

  .template-option:last-child {
    border-bottom: none;
  }

  .template-option:hover {
    background: var(--color-surface-hover, #f0f9ff);
  }

  .template-name {
    font-weight: 600;
    color: var(--color-text-primary, #1f2937);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .template-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    font-style: italic;
    padding: 0.5rem;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    background: var(--color-surface, #ffffff);
    text-align: left;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .macro-btn:hover, .phrase-btn:hover {
    background: #e3f2fd;
    border-color: #bbdefb;
  }
  
  .macro-btn {
    font-weight: 500;
  }
  
  .phrase-btn {
  }

  /* Macro dropdown specific styles */
  .macro-dropdown-btn { 
    background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
    border-color: #10b981; 
  }
  
  .macro-dropdown-btn:hover { 
    background: linear-gradient(135deg, #059669 0%, #047857 100%); 
    transform: translateY(-1px); 
  }

  .macro-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    margin-top: 0.25rem;
    overflow: hidden;
  }

  .macro-option {
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: var(--color-surface, #ffffff);
    text-align: left;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid var(--color-border-light, #f3f4f6);
  }

  .macro-option:last-child {
    border-bottom: none;
  }

  .macro-option:hover {
    background: var(--color-surface-hover, #f0f9ff);
  }

  .macro-name {
    font-weight: 600;
    color: var(--color-text-primary, #1f2937);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .macro-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    font-style: italic;
  }

  .btn-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .pool-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
    text-transform: uppercase;
    font-weight: 500;
  }

  /* Dark mode overrides */
  :global([data-theme="dark"]) .template-dropdown,
  :global([data-theme="dark"]) .macro-dropdown {
    background: #1e293b;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .search-box {
    background: #1e293b;
    border-bottom-color: #334155;
  }

  :global([data-theme="dark"]) .search-input {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .template-option,
  :global([data-theme="dark"]) .macro-option {
    background: #1e293b;
    border-bottom-color: #334155;
  }

  :global([data-theme="dark"]) .template-option:hover,
  :global([data-theme="dark"]) .macro-option:hover {
    background: #334155;
  }

  :global([data-theme="dark"]) .template-name,
  :global([data-theme="dark"]) .macro-name {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .template-desc,
  :global([data-theme="dark"]) .macro-desc {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .empty-state {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .panel-section h3 {
    color: #f1f5f9;
    border-bottom-color: #334155;
  }

  :global([data-theme="dark"]) .scope-toggle {
    background: #0f172a;
    border-bottom-color: #334155;
  }

  :global([data-theme="dark"]) .scope-btn {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .scope-btn:hover:not(.active) {
    background: #334155;
  }
</style>
