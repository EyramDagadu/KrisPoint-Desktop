<!-- src/routes/templates/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { sanitizeHTML } from '$lib/utils/htmlSanitizer.js';
  import RichTextField from '$lib/components/ui/RichTextField.svelte';
  import { toastSuccess, toastError } from '$lib/utils/toast.js';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import PremiumGate from '$lib/components/ui/PremiumGate.svelte';
  import { isLicenseActive, hasFeature } from '$lib/stores/licenseStore.js';
  
  $: isPremium = hasFeature('templates');
  
  let templates = [];
  let searchTerm = '';
  let selectedTemplate = null;
  let showPreview = false;
  let showCreateModal = false;
  let isEditMode = false;
  let editingTemplate = null;
  let showDeleteConfirm = false;
  let templateToDelete = null;
  let loading = true;
  let saving = false;
  let canManageSystem = false;
  let currentUserId = null;
  
  let activeTab = 'system';
  
  let newTemplate = {
    name: '',
    category: '',
    modality: '',
    bodyRegion: '',
    voiceCommand: '',
    comparisonHtml: '',
    techniqueHtml: '',
    findingsHtml: '',
    impressionHtml: '',
    content: '',
    variables: []
  };
  
  onMount(async () => {
    await checkUserRole();
    await loadTemplates();
  });

  async function checkUserRole() {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          currentUserId = data.user.id;
          canManageSystem = data.permissions?.includes('templates.manage_system') || false;
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  }

  async function loadTemplates() {
    loading = true;
    try {
      const res = await fetch(`/api/templates?scope=${activeTab}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          templates = data.templates || [];
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toastError('Failed to load templates');
    } finally {
      loading = false;
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    loadTemplates();
  }

  function getCategoryDisplayName(category) {
    const names = {
      ct: 'CT',
      mri: 'MRI', 
      xray: 'X-Ray',
      ultrasound: 'Ultrasound',
      trauma: 'Trauma',
      nuclear: 'Nuclear Medicine',
      mammography: 'Mammography',
      general: 'General'
    };
    return names[category?.toLowerCase()] || category || 'Uncategorized';
  }

  function getModalityDisplayName(modality) {
    const names = {
      ct: 'CT Scan',
      mri: 'MRI', 
      xray: 'X-Ray',
      us: 'Ultrasound',
      mg: 'Mammography',
      fl: 'Fluoroscopy',
      nm: 'Nuclear Medicine',
      petct: 'PET-CT'
    };
    return names[modality?.toLowerCase()] || modality || '';
  }

  function previewTemplate(template) {
    selectedTemplate = template;
    showPreview = true;
  }

  function closePreview() {
    showPreview = false;
    selectedTemplate = null;
  }

  function useTemplate(template) {
    goto(`/reporting?dbTemplateId=${template.id}`);
  }
  
  function editTemplate(template) {
    isEditMode = true;
    editingTemplate = template;
    
    newTemplate = {
      name: template.name || '',
      category: template.category || '',
      modality: template.modality || '',
      bodyRegion: template.bodyRegion || '',
      voiceCommand: template.voiceCommand || '',
      comparisonHtml: template.comparisonHtml || '',
      techniqueHtml: template.techniqueHtml || '',
      findingsHtml: template.findingsHtml || '',
      impressionHtml: template.impressionHtml || '',
      content: template.content || '',
      variables: template.variables || []
    };
    
    showCreateModal = true;
  }
  
  function createTemplate() {
    isEditMode = false;
    editingTemplate = null;
    resetNewTemplate();
    showCreateModal = true;
  }

  function resetNewTemplate() {
    newTemplate = {
      name: '',
      category: '',
      modality: '',
      bodyRegion: '',
      voiceCommand: '',
      comparisonHtml: '',
      techniqueHtml: '',
      findingsHtml: '',
      impressionHtml: '',
      content: '',
      variables: []
    };
  }

  function closeCreateModal() {
    showCreateModal = false;
  }

  function confirmDeleteTemplate(template) {
    templateToDelete = template;
    showDeleteConfirm = true;
  }

  async function deleteTemplate() {
    if (!templateToDelete) return;

    try {
      const res = await fetch(`/api/templates/${templateToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (data.success) {
        await loadTemplates();
        toastSuccess('Template deleted successfully');
      } else {
        toastError(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toastError('Failed to delete template');
    } finally {
      templateToDelete = null;
    }
  }

  async function saveNewTemplate() {
    // At least one section is required
    const hasContent = newTemplate.comparisonHtml?.trim() || 
                       newTemplate.techniqueHtml?.trim() || 
                       newTemplate.findingsHtml?.trim() || 
                       newTemplate.impressionHtml?.trim();
    
    if (!newTemplate.name.trim() || !hasContent) {
      toastError('Please enter template name and at least one section');
      return;
    }

    saving = true;
    
    try {
      const isSystem = activeTab === 'system';
      
      const payload = {
        name: newTemplate.name,
        category: newTemplate.category || null,
        modality: newTemplate.modality || null,
        bodyRegion: newTemplate.bodyRegion || null,
        voiceCommand: newTemplate.voiceCommand || null,
        comparisonHtml: newTemplate.comparisonHtml || null,
        techniqueHtml: newTemplate.techniqueHtml || null,
        findingsHtml: newTemplate.findingsHtml || null,
        impressionHtml: newTemplate.impressionHtml || null,
        variables: newTemplate.variables || null,
        isSystem: isSystem
      };
      
      let res;
      if (isEditMode && editingTemplate) {
        res = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/templates', {
          method: 'POST',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
      
      const data = await res.json();

      if (data.success) {
        await loadTemplates();
        closeCreateModal();
        toastSuccess(isEditMode ? 'Template updated successfully' : 'Template created successfully');
      } else {
        toastError(data.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toastError('Failed to save template');
    } finally {
      saving = false;
    }
  }

  function canEditTemplate(template) {
    if (activeTab === 'system') {
      return canManageSystem;
    }
    return template.createdBy === currentUserId;
  }

  function canDeleteTemplate(template) {
    if (activeTab === 'system') {
      return canManageSystem;
    }
    return template.createdBy === currentUserId;
  }

  function canCreateTemplate() {
    if (activeTab === 'system') {
      return canManageSystem;
    }
    return true;
  }

  $: filteredTemplates = searchTerm ? 
    templates.filter(template => 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.category && template.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (template.voiceCommand && template.voiceCommand.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : templates;

  $: groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {});

  // Reactive statement for create permission
  $: canCreate = activeTab === 'system' ? canManageSystem : true;
</script>

<svelte:head>
  <title>Report Templates - KrisPoint</title>
</svelte:head>

{#if !isPremium}
  <div class="templates-page">
    <PremiumGate feature="templates" />
  </div>
{:else}
<div class="templates-page">
    <div class="page-header">
      <p>Professional radiology report templates for faster reporting</p>
      
      <div class="header-actions">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Search templates..." 
            bind:value={searchTerm}
            class="search-input"
          >
        </div>
        {#if canCreate}
          <button class="btn btn-primary" on:click={createTemplate}>
            <span>+</span>
            Create {activeTab === 'system' ? 'System' : 'Personal'} Template
          </button>
        {/if}
      </div>
    </div>
    
    <div class="tabs">
      <button 
        class="tab" 
        class:active={activeTab === 'system'}
        on:click={() => switchTab('system')}
      >
        System Templates
      </button>
      <button 
        class="tab" 
        class:active={activeTab === 'personal'}
        on:click={() => switchTab('personal')}
      >
        My Templates
      </button>
    </div>
    
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading templates...</p>
      </div>
    {:else if filteredTemplates.length === 0}
      <div class="empty-state">
        <h3>No {activeTab} templates found</h3>
        <p>
          {#if activeTab === 'system'}
            {#if canManageSystem}
              Create system templates that will be available to all users.
            {:else}
              System templates are managed by administrators. Switch to "My Templates" to create your own.
            {/if}
          {:else}
            Create personal templates for your own use.
          {/if}
        </p>
        {#if canCreate}
          <button class="btn btn-primary" on:click={createTemplate}>
            Create Template
          </button>
        {/if}
      </div>
    {:else}
      <div class="templates-grid">
        {#each Object.entries(groupedTemplates) as [category, categoryTemplates]}
          <div class="template-category">
            <h2>{getCategoryDisplayName(category)}</h2>
            <div class="templates-list">
              {#each categoryTemplates as template}
                <div class="template-card">
                  <div class="template-header">
                    <h3>{template.name}</h3>
                  </div>
                  {#if template.voiceCommand}
                    <div class="template-voice">
                      🎤 "{template.voiceCommand}"
                    </div>
                  {/if}
                  <div class="template-actions">
                    <button class="btn btn-outline btn-icon" on:click={() => previewTemplate(template)} title="Preview template">
                      👁️
                    </button>
                    {#if canEditTemplate(template)}
                      <button class="btn btn-outline btn-icon" on:click={() => editTemplate(template)} title="Edit template">
                        ✏️
                      </button>
                    {/if}
                    <button class="btn btn-secondary btn-icon" on:click={() => useTemplate(template)} title="Use template">
                      📄
                    </button>
                    {#if canDeleteTemplate(template)}
                      <button class="btn btn-danger btn-icon" on:click={() => confirmDeleteTemplate(template)} title="Delete template">
                        🗑️
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

<!-- Template Preview Modal -->
{#if showPreview && selectedTemplate}
  <div class="modal-overlay" on:click={closePreview}>
    <div class="modal-content preview-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{selectedTemplate.name}</h3>
        <button class="close-btn" on:click={closePreview}>×</button>
      </div>
      <div class="modal-body">
        <div class="template-preview">
          <div class="template-meta">
            {#if selectedTemplate.voiceCommand}
              <p><strong>Voice Command:</strong> <span class="voice-command-preview">"{selectedTemplate.voiceCommand}"</span></p>
            {/if}
            {#if selectedTemplate.modality}
              <p><strong>Modality:</strong> {getModalityDisplayName(selectedTemplate.modality)}</p>
            {/if}
            {#if selectedTemplate.bodyRegion}
              <p><strong>Body Region:</strong> {selectedTemplate.bodyRegion}</p>
            {/if}
          </div>
          
          <div class="template-content-preview">
            <h4>Template Content</h4>
            <div class="content-box">
              {@html sanitizeHTML(selectedTemplate.content || 'No content')}
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={closePreview}>Close</button>
        <button class="btn btn-primary" on:click={() => { closePreview(); useTemplate(selectedTemplate); }}>
          Use This Template
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Create/Edit Template Modal -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={closeCreateModal}>
    <div class="modal-content create-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{isEditMode ? 'Edit Template' : `Create ${activeTab === 'system' ? 'System' : 'Personal'} Template`}</h3>
        <button class="close-btn" on:click={closeCreateModal}>×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label for="templateName">Template Name *</label>
            <input 
              id="templateName"
              type="text" 
              bind:value={newTemplate.name}
              placeholder="e.g., Normal CT Head"
            >
          </div>
          
          <div class="form-group">
            <label for="templateCategory">Category</label>
            <select id="templateCategory" bind:value={newTemplate.category}>
              <option value="">Select category...</option>
              <option value="ct">CT</option>
              <option value="mri">MRI</option>
              <option value="xray">X-Ray</option>
              <option value="ultrasound">Ultrasound</option>
              <option value="mammography">Mammography</option>
              <option value="nuclear">Nuclear Medicine</option>
              <option value="general">General</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="templateModality">Modality</label>
            <select id="templateModality" bind:value={newTemplate.modality}>
              <option value="">Select modality...</option>
              <option value="ct">CT Scan</option>
              <option value="mri">MRI</option>
              <option value="xray">X-Ray</option>
              <option value="us">Ultrasound</option>
              <option value="mg">Mammography</option>
              <option value="fl">Fluoroscopy</option>
              <option value="nm">Nuclear Medicine</option>
              <option value="petct">PET-CT</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="templateBodyRegion">Body Region</label>
            <input 
              id="templateBodyRegion"
              type="text" 
              bind:value={newTemplate.bodyRegion}
              placeholder="e.g., Head, Chest, Abdomen"
            >
          </div>
          
          <div class="form-group full-width">
            <label for="templateVoiceCommand">Voice Command</label>
            <input 
              id="templateVoiceCommand"
              type="text" 
              bind:value={newTemplate.voiceCommand}
              placeholder="e.g., normal ct head"
            >
            <span class="field-hint">Say this phrase to insert this template via voice</span>
          </div>
          
          <!-- Section Editors -->
          <div class="form-group full-width section-editors">
            <h4 class="sections-title">Template Sections</h4>
            <p class="sections-hint">Fill in the sections you need. Voice navigation commands will work with these sections (e.g., "go to findings").</p>
            
            <div class="section-editor">
              <label for="comparisonSection">COMPARISON</label>
              <RichTextField
                value={newTemplate.comparisonHtml}
                placeholder="Enter comparison text..."
                on:input={(e) => newTemplate.comparisonHtml = e.detail.value}
              />
            </div>
            
            <div class="section-editor">
              <label for="techniqueSection">TECHNIQUE</label>
              <RichTextField
                value={newTemplate.techniqueHtml}
                placeholder="Enter technique description..."
                on:input={(e) => newTemplate.techniqueHtml = e.detail.value}
              />
            </div>
            
            <div class="section-editor">
              <label for="findingsSection">FINDINGS</label>
              <RichTextField
                value={newTemplate.findingsHtml}
                placeholder="Enter findings..."
                showTableButton={true}
                on:input={(e) => newTemplate.findingsHtml = e.detail.value}
              />
            </div>
            
            <div class="section-editor">
              <label for="impressionSection">IMPRESSION</label>
              <RichTextField
                value={newTemplate.impressionHtml}
                placeholder="Enter impression..."
                on:input={(e) => newTemplate.impressionHtml = e.detail.value}
              />
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={closeCreateModal}>Cancel</button>
        <button class="btn btn-primary" on:click={saveNewTemplate} disabled={saving}>
          {saving ? 'Saving...' : (isEditMode ? 'Update Template' : 'Create Template')}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
  show={showDeleteConfirm}
  title="Delete Template"
  message="Are you sure you want to delete this template? This action cannot be undone."
  confirmText="Delete"
  confirmClass="danger"
  on:confirm={deleteTemplate}
  on:cancel={() => { showDeleteConfirm = false; templateToDelete = null; }}
/>
{/if}

<style>
  .templates-page {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-header p {
    color: var(--text-secondary, #64748b);
    margin-bottom: 1rem;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .search-box {
    flex: 1;
    min-width: 200px;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    font-size: 0.9375rem;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1e293b);
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--border-color, #e2e8f0);
    padding-bottom: 0;
  }

  .tab {
    padding: 0.75rem 1.5rem;
    border: none;
    background: transparent;
    color: var(--text-secondary, #64748b);
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
  }

  .tab.active {
    color: var(--primary-color, #3b82f6);
    border-bottom-color: var(--primary-color, #3b82f6);
  }

  .tab:hover:not(.active) {
    color: var(--text-primary, #1e293b);
  }

  .loading-state, .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary, #64748b);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color, #e2e8f0);
    border-top-color: var(--primary-color, #3b82f6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state h3 {
    color: var(--text-primary, #1e293b);
    margin-bottom: 0.5rem;
  }

  .empty-state .btn {
    margin-top: 1rem;
  }

  .templates-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .template-category h2 {
    font-size: 1.125rem;
    color: var(--text-primary, #1e293b);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }

  .templates-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .template-card {
    background: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: box-shadow 0.2s;
  }

  .template-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .template-header h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #1e293b);
    margin: 0;
  }

  .template-voice {
    font-size: 0.875rem;
    color: var(--primary-color, #3b82f6);
  }

  .template-actions {
    display: flex;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-color, #e2e8f0);
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-size: 0.875rem;
    transition: all 0.2s;
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
  }

  .btn-outline {
    background: transparent;
    border: 1px solid var(--border-color, #e2e8f0);
    color: var(--text-primary, #1e293b);
  }

  .btn-outline:hover {
    background: var(--bg-secondary, #f1f5f9);
    border-color: var(--primary-color, #3b82f6);
  }

  .btn-danger {
    background: transparent;
    border: 1px solid var(--border-color, #e2e8f0);
    color: var(--text-secondary, #64748b);
  }

  .btn-danger:hover {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    background: transparent;
    border: 1px solid var(--border-color, #e2e8f0);
    color: var(--text-secondary, #64748b);
  }

  .btn-icon:hover {
    background: var(--bg-secondary, #f1f5f9);
    border-color: var(--primary-color, #3b82f6);
    color: var(--primary-color, #3b82f6);
  }

  .btn-icon.btn-secondary {
    background: transparent;
    border: 1px solid var(--border-color, #e2e8f0);
    color: var(--text-secondary, #64748b);
  }

  .btn-icon.btn-secondary:hover {
    background: var(--primary-color, #3b82f6);
    border-color: var(--primary-color, #3b82f6);
    color: white;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Modal styles */
  .modal-overlay {
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
    padding: 1rem;
  }

  .modal-content {
    background: var(--bg-primary, #ffffff);
    border-radius: 12px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .preview-modal {
    max-width: 700px;
  }

  .create-modal {
    max-width: 800px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }

  .modal-header h3 {
    margin: 0;
    color: var(--text-primary, #1e293b);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary, #64748b);
    line-height: 1;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color, #e2e8f0);
  }

  .template-meta {
    margin-bottom: 1rem;
  }

  .template-meta p {
    margin: 0.25rem 0;
    color: var(--text-secondary, #64748b);
  }

  .voice-command-preview {
    color: var(--primary-color, #3b82f6);
    font-weight: 500;
  }

  .template-content-preview h4 {
    margin: 1rem 0 0.5rem;
    color: var(--text-primary, #1e293b);
  }

  .content-box {
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    padding: 1rem;
    color: var(--text-primary, #1e293b);
    line-height: 1.6;
    max-height: 300px;
    overflow-y: auto;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .section-editors {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sections-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    color: var(--text-primary, #1e293b);
  }

  .sections-hint {
    font-size: 0.85rem;
    color: var(--text-secondary, #64748b);
    margin: 0 0 1rem 0;
  }

  .section-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--bg-secondary, #f8fafc);
    border-radius: 8px;
    border: 1px solid var(--border-color, #e2e8f0);
  }

  .section-editor label {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--primary-color, #3b82f6);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .form-group label {
    font-weight: 500;
    color: var(--text-primary, #1e293b);
    font-size: 0.875rem;
  }

  .form-group input,
  .form-group select {
    padding: 0.75rem;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    font-size: 0.9375rem;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1e293b);
  }

  .field-hint {
    font-size: 0.75rem;
    color: var(--text-secondary, #64748b);
  }


  :global([data-theme="dark"]) .toggle-btn:hover:not(.active) {
    background: #334155;
  }

  :global([data-theme="dark"]) .tabs {
    border-bottom-color: #334155;
  }

  :global([data-theme="dark"]) .tab {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .tab.active {
    color: var(--primary-color, #3b82f6);
  }

  :global([data-theme="dark"]) .page-header p {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .search-input {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .search-input::placeholder {
    color: #64748b;
  }

  :global([data-theme="dark"]) .template-card {
    background: #1e293b;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .template-header h3 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .template-voice {
    color: #60a5fa;
  }

  :global([data-theme="dark"]) .template-actions {
    border-top-color: #334155;
  }

  :global([data-theme="dark"]) .modal-content {
    background: #1e293b;
  }

  :global([data-theme="dark"]) .modal-header,
  :global([data-theme="dark"]) .modal-footer {
    border-color: #334155;
  }

  :global([data-theme="dark"]) .modal-header h3 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .content-box {
    background: #0f172a;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .form-group label {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .form-group input,
  :global([data-theme="dark"]) .form-group select {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .section-editor {
    background: #0f172a;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .section-label {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .sections-title {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .sections-hint {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .template-category h2 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .empty-state h3 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .empty-state p {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .btn-icon {
    border-color: #334155;
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .btn-icon:hover {
    background: #334155;
    border-color: var(--primary-color, #3b82f6);
    color: var(--primary-color, #3b82f6);
  }

  :global([data-theme="dark"]) .btn-icon.btn-secondary:hover {
    background: var(--primary-color, #3b82f6);
    border-color: var(--primary-color, #3b82f6);
    color: white;
  }

  :global([data-theme="dark"]) .btn-danger {
    border-color: #334155;
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .btn-danger:hover {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
  }

  :global([data-theme="dark"]) .template-meta p {
    color: #94a3b8;
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .templates-list {
      grid-template-columns: 1fr;
    }
  }
</style>
