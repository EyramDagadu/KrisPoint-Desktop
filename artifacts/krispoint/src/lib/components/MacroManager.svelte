<!-- MacroManager.svelte - Fixed integration with corrected macroStore -->
<script>
  import { onMount } from 'svelte';
  import { macroStore } from '$lib/stores/macroStore.js';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import { toastSuccess, toastError, toastWarning } from '$lib/utils/toast.js';
  
  let macros = [];
  let selectedCategory = 'All';
  let showAddForm = false;
  let editingMacro = null;
  let searchTerm = '';
  let showDeleteMacroConfirm = false;
  let macroToDelete = null;
  
  // Subscribe to macro store
  const unsubscribe = macroStore.subscribe(value => {
    macros = value;
  });
  
  // Reactive filtered macros list - updates automatically when macros, category, or search changes
  $: filteredMacros = (() => {
    let filtered = macros;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(macro => macro.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(macro => 
        macro.name.toLowerCase().includes(search) ||
        macro.voiceCommand.toLowerCase().includes(search) ||
        macro.content.toLowerCase().includes(search)
      );
    }
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  })();
  
  // Form fields
  let newMacro = {
    id: '',
    name: '',
    voiceCommand: '',
    content: '',
    category: 'General',
    variables: []
  };
  
  // Categories for organization (standardized with icons)
  const categories = [
    { id: 'All', label: '📋 All', icon: '📋' },
    { id: 'General', label: '📝 General', icon: '📝' },
    { id: 'Neuro', label: '🧠 Neuro', icon: '🧠' },
    { id: 'Chest', label: '🫁 Chest', icon: '🫁' },
    { id: 'Abdomen', label: '🫃 Abdomen', icon: '🫃' },
    { id: 'MSK', label: '🦴 MSK', icon: '🦴' },
    { id: 'Procedures', label: '💉 Procedures', icon: '💉' },
    { id: 'Impressions', label: '💭 Impressions', icon: '💭' }
  ];
  
  // Get category icon for display
  function getCategoryIcon(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.icon : '📄';
  }
  
  // Common variable placeholders
  const availableVariables = [
    { name: 'DATE', description: 'Current date' },
    { name: 'TIME', description: 'Current time' },
    { name: 'PHYSICIAN', description: 'Physician name' },
    { name: 'PATIENT_NAME', description: 'Patient name' },
    { name: 'AGE', description: 'Patient age' },
    { name: 'EXAM_TYPE', description: 'Type of examination' },
    { name: 'INDICATION', description: 'Clinical indication' }
  ];
  
  onMount(() => {
    // Initialize macro store - this loads defaults and custom macros
    macroStore.init();
  });
  
  function startAddMacro() {
    resetForm();
    showAddForm = true;
    editingMacro = null;
  }
  
  function editMacro(macro) {
    newMacro = { ...macro };
    showAddForm = true;
    editingMacro = macro;
  }
  
  function resetForm() {
    newMacro = {
      id: '',
      name: '',
      voiceCommand: '',
      content: '',
      category: 'General',
      variables: []
    };
    showAddForm = false;
    editingMacro = null;
  }
  
  function saveMacro() {
    if (!newMacro.name.trim() || !newMacro.voiceCommand.trim() || !newMacro.content.trim()) {
      toastError('Please fill in all required fields (Name, Voice Command, Content)');
      return;
    }
    
    try {
      if (editingMacro) {
        // Update existing macro
        macroStore.updateMacro(newMacro);
      } else {
        // Add new macro
        newMacro.id = 'macro_' + Date.now();
        macroStore.addMacro(newMacro);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving macro:', error);
      toastError('Error saving macro. Please try again.');
    }
  }
  
  function deleteMacro(id) {
    macroToDelete = id;
    showDeleteMacroConfirm = true;
  }

  function confirmDeleteMacro() {
    if (macroToDelete) {
      try {
        macroStore.deleteMacro(macroToDelete);
        toastSuccess('Macro deleted successfully');
        macroToDelete = null;
      } catch (error) {
        console.error('Error deleting macro:', error);
        toastError('Error deleting macro. Please try again.');
      }
    }
  }
  
  function addVariable(variableName) {
    if (newMacro.content) {
      newMacro.content += ` {${variableName}}`;
    } else {
      newMacro.content = `{${variableName}}`;
    }
  }
  
  function exportMacros() {
    const exportData = macroStore.exportMacros();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(exportData);
    
    const exportFileDefaultName = 'krispoint_macros_' + new Date().toISOString().slice(0,10) + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
  
  function importMacros(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedCount = macroStore.importMacros(e.target.result);
        toastSuccess(`Successfully imported ${importedCount} macros!`);
      } catch (error) {
        console.error('Import error:', error);
        toastError('Error importing macros. Please ensure the file is valid.');
      }
    };
    reader.readAsText(file);
  }
  
</script>

<div class="macro-manager">
  <div class="macro-header">
    <p>Create and manage voice-activated macros for faster reporting</p>
  </div>
  
  <div class="macro-controls">
    <div class="control-group">
      <button class="btn btn-primary" on:click={startAddMacro}>
        ➕ Add New Macro
      </button>
      
      <button class="btn btn-secondary" on:click={exportMacros}>
        📤 Export All
      </button>
      
      <label class="btn btn-secondary">
        📥 Import
        <input type="file" accept=".json" on:change={importMacros} style="display: none;">
      </label>
    </div>
    
    <div class="control-group">
      <input 
        type="text" 
        placeholder="Search macros..." 
        bind:value={searchTerm}
        class="search-input"
      >
      
      <select bind:value={selectedCategory} class="category-select">
        {#each categories as category}
          <option value={category.id}>{category.label}</option>
        {/each}
      </select>
    </div>
  </div>
  
  {#if showAddForm}
    <div class="macro-form-overlay">
      <div class="macro-form">
        <div class="form-header">
          <h2>{editingMacro ? 'Edit Macro' : 'Add New Macro'}</h2>
          <button class="btn-close" on:click={resetForm}>✕</button>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label for="macro-name">Macro Name *</label>
            <input 
              type="text" 
              id="macro-name"
              bind:value={newMacro.name}
              placeholder="e.g., Normal Chest X-ray"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="voice-command">Voice Command *</label>
            <input 
              type="text" 
              id="voice-command"
              bind:value={newMacro.voiceCommand}
              placeholder="e.g., normal chest"
              required
            >
            <small class="field-hint">Say "macro {newMacro.voiceCommand || 'your command'}" to insert this macro</small>
          </div>
          
          <div class="form-group">
            <label for="category">Category</label>
            <select id="category" bind:value={newMacro.category}>
              {#each categories.slice(1) as category}
                <option value={category.id}>{category.label}</option>
              {/each}
            </select>
          </div>
          
          <div class="form-group full-width">
            <label for="content">Content *</label>
            <textarea 
              id="content"
              bind:value={newMacro.content}
              placeholder="Enter the macro content that will be inserted..."
              rows="5"
              required
            ></textarea>
          </div>
          
          <div class="form-group full-width">
            <label>Available Variables (click to insert)</label>
            <div class="variable-buttons">
              <span>Click to insert:</span>
              {#each availableVariables as variable}
                <button 
                  type="button" 
                  class="btn btn-secondary btn-small"
                  on:click={() => addVariable(variable.name)}
                  title={variable.description}
                >
                  {variable.name}
                </button>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" on:click={saveMacro}>
            {editingMacro ? 'Update Macro' : 'Save Macro'}
          </button>
          <button class="btn btn-secondary" on:click={resetForm}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}
  
  <div class="macro-list">
    <div class="list-header">
      <h3>
        {selectedCategory === 'All' ? 'All Macros' : `${selectedCategory} Macros`}
        <span class="macro-count">({filteredMacros.length})</span>
      </h3>
    </div>
    
    <div class="macro-grid">
      {#each filteredMacros as macro}
        <div class="macro-card">
          <div class="macro-card-header">
            <div class="macro-info">
              <h3 class="macro-name">{macro.name}</h3>
              <span class="macro-category">{getCategoryIcon(macro.category)} {macro.category}</span>
            </div>
            
            <div class="macro-actions">
              <button 
                class="btn-icon" 
                on:click={() => editMacro(macro)}
                title="Edit macro"
              >
                ✏️
              </button>
              <button 
                class="btn-icon btn-danger" 
                on:click={() => deleteMacro(macro.id)}
                title="Delete macro"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div class="voice-command">
            <strong>Voice Command:</strong> "{macro.voiceCommand}"
          </div>
          
          <div class="macro-content">
            <strong>Content:</strong>
            <div class="content-preview">
              {macro.content.length > 150 ? macro.content.substring(0, 150) + '...' : macro.content}
            </div>
          </div>
        </div>
      {/each}
      
      {#if filteredMacros.length === 0}
        <div class="empty-state">
          {#if searchTerm || selectedCategory !== 'All'}
            <p>No macros found matching your search criteria.</p>
            <button class="btn btn-secondary" on:click={() => { searchTerm = ''; selectedCategory = 'All'; }}>
              Clear Filters
            </button>
          {:else}
            <p>No macros created yet.</p>
            <button class="btn btn-primary" on:click={startAddMacro}>
              Create Your First Macro
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .macro-manager {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .macro-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  
  .macro-header p {
    color: var(--color-text-muted, #7f8c8d);
    font-size: 1.1rem;
  }
  
  .macro-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .control-group {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-primary {
    background: var(--color-primary, #3498db);
    color: white;
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }
  
  .btn-secondary {
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #2c3e50);
    border: 1px solid var(--color-border, #d1d5db);
  }
  
  .btn-secondary:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }
  
  .search-input {
    padding: 0.75rem;
    border: 2px solid var(--color-border, #ecf0f1);
    border-radius: 8px;
    font-size: 0.9rem;
    min-width: 200px;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #2c3e50);
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--color-primary, #3498db);
  }
  
  .category-select {
    padding: 0.75rem;
    border: 2px solid var(--color-border, #ecf0f1);
    border-radius: 8px;
    font-size: 0.9rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #2c3e50);
  }
  
  .macro-form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 2rem;
  }
  
  .macro-form {
    background: var(--color-surface, #ffffff);
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--color-border, #ecf0f1);
  }
  
  .form-header h2 {
    margin: 0;
    color: var(--color-text-primary, #2c3e50);
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-muted, #7f8c8d);
    padding: 0.25rem;
  }
  
  .btn-close:hover {
    color: var(--color-danger, #e74c3c);
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-group.full-width {
    grid-column: 1 / -1;
  }
  
  .form-group label {
    font-weight: 600;
    color: var(--color-text-primary, #2c3e50);
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.75rem;
    border: 2px solid var(--color-border, #ecf0f1);
    border-radius: 8px;
    font-size: 0.9rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #2c3e50);
    transition: border-color 0.2s ease;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--color-primary, #3498db);
  }
  
  .field-hint {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.85rem;
    color: var(--color-text-muted, #7f8c8d);
  }
  
  .variable-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    padding: 1rem;
    background: var(--color-background-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
  }
  
  .variable-buttons span {
    font-size: 0.9rem;
    color: var(--color-text-muted, #7f8c8d);
    margin-right: 0.5rem;
  }
  
  .btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #2c3e50);
    border: 1px solid var(--color-border, #d1d5db);
  }
  
  .btn-small:hover {
    background: var(--color-surface-hover, #f3f4f6);
    color: var(--color-text-primary, #2c3e50);
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
  
  .macro-list {
    margin-top: 2rem;
  }
  
  .list-header {
    margin-bottom: 1rem;
  }
  
  .macro-count {
    color: var(--color-text-muted, #7f8c8d);
    font-weight: 600;
  }
  
  .macro-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .macro-card {
    background: var(--color-surface, #ffffff);
    border: 2px solid var(--color-border, #ecf0f1);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s ease;
  }
  
  .macro-card:hover {
    border-color: var(--color-primary, #3498db);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
  }
  
  .macro-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .macro-info {
    flex: 1;
  }
  
  .macro-name {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary, #2c3e50);
    font-size: 1.1rem;
  }
  
  .macro-category {
    background: var(--color-primary-light, #e3f2fd);
    color: var(--color-primary, #1976d2);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .macro-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: background 0.2s ease;
  }
  
  .btn-icon:hover {
    background: var(--color-surface-secondary, #ecf0f1);
  }
  
  .btn-icon.btn-danger:hover {
    background: var(--color-danger-light, #ffebee);
  }
  
  .voice-command {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: var(--color-background-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--color-text-primary, #2c3e50);
  }
  
  .macro-content {
    font-size: 0.9rem;
    color: var(--color-text-primary, #2c3e50);
  }
  
  .content-preview {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: var(--color-background-secondary, #f8fafc);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    color: var(--color-text-muted, #5d6d7e);
    line-height: 1.4;
  }
  
  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: var(--color-text-muted, #7f8c8d);
  }
  
  .empty-state p {
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
  }
  
  @media (max-width: 768px) {
    .macro-manager {
      padding: 1rem;
    }
    
    .macro-controls {
      flex-direction: column;
      align-items: stretch;
    }
    
    .control-group {
      justify-content: center;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .macro-grid {
      grid-template-columns: 1fr;
    }
    
    .search-input {
      min-width: auto;
    }
  }
</style>

<ConfirmDialog
  bind:show={showDeleteMacroConfirm}
  title="Delete Macro?"
  message="Are you sure you want to delete this macro? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  danger={true}
  on:confirm={confirmDeleteMacro}
/>