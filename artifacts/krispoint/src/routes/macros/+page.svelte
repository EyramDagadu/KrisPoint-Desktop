<!-- routes/macros/+page.svelte - Macro Management Page with System/Personal pools -->
<script>
  import { onMount } from 'svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import { toastSuccess, toastError } from '$lib/utils/toast.js';
  import PremiumGate from '$lib/components/ui/PremiumGate.svelte';
  import { isLicenseActive, hasFeature } from '$lib/stores/licenseStore.js';
  import { isSoloEdition } from '$lib/config/edition.js';
  
  $: isPremium = hasFeature('macros');
  
  let macros = [];
  let selectedCategory = 'All';
  let showAddForm = false;
  let editingMacro = null;
  let searchTerm = '';
  let showDeleteConfirm = false;
  let macroToDelete = null;
  let loading = true;
  let saving = false;
  let canManageSystem = false;
  let currentUserId = null;
  
  let activeTab = isSoloEdition ? 'all' : 'system';
  
  let newMacro = {
    name: '',
    voiceCommand: '',
    content: '',
    category: 'General',
  };
  
  const categories = [
    { id: 'All', label: 'All', icon: '📋' },
    { id: 'General', label: 'General', icon: '📝' },
    { id: 'Neuro', label: 'Neuro', icon: '🧠' },
    { id: 'Chest', label: 'Chest', icon: '🫁' },
    { id: 'Abdomen', label: 'Abdomen', icon: '🫃' },
    { id: 'MSK', label: 'MSK', icon: '🦴' },
    { id: 'Procedures', label: 'Procedures', icon: '💉' },
    { id: 'Impressions', label: 'Impressions', icon: '💭' }
  ];
  
  onMount(async () => {
    await checkUserRole();
    await loadMacros();
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
          canManageSystem = data.permissions?.includes('macros.manage_system') || false;
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  }

  async function loadMacros() {
    loading = true;
    try {
      const res = await fetch(isSoloEdition ? '/api/macros' : `/api/macros?scope=${activeTab}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          macros = data.macros || [];
        }
      }
    } catch (error) {
      console.error('Error loading macros:', error);
      toastError('Failed to load macros');
    } finally {
      loading = false;
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    loadMacros();
  }

  function getCategoryIcon(categoryId) {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.icon : '📄';
  }

  function startAddMacro() {
    resetForm();
    showAddForm = true;
    editingMacro = null;
  }
  
  function editMacro(macro) {
    newMacro = {
      name: macro.name || '',
      voiceCommand: macro.voiceCommand || '',
      content: macro.content || '',
      category: macro.category || 'General',
      variables: macro.variables || []
    };
    showAddForm = true;
    editingMacro = macro;
  }
  
  function resetForm() {
    newMacro = {
      name: '',
      voiceCommand: '',
      content: '',
      category: 'General',
      variables: []
    };
    showAddForm = false;
    editingMacro = null;
  }
  
  async function saveMacro() {
    if (!newMacro.name.trim() || !newMacro.content.trim()) {
      toastError('Please fill in name and content');
      return;
    }
    
    saving = true;
    
    try {
      const isSystem = !isSoloEdition && activeTab === 'system';
      
      const payload = {
        name: newMacro.name,
        voiceCommand: newMacro.voiceCommand || null,
        content: newMacro.content,
        category: newMacro.category || 'General',
        variables: newMacro.variables || null,
        isSystem: isSystem
      };
      
      let res;
      if (editingMacro) {
        res = await fetch(`/api/macros/${editingMacro.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/macros', {
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
        await loadMacros();
        resetForm();
        toastSuccess(editingMacro ? 'Macro updated successfully' : 'Macro created successfully');
      } else {
        toastError(data.error || 'Failed to save macro');
      }
    } catch (error) {
      console.error('Error saving macro:', error);
      toastError('Failed to save macro');
    } finally {
      saving = false;
    }
  }
  
  function confirmDeleteMacro(macro) {
    macroToDelete = macro;
    showDeleteConfirm = true;
  }

  async function deleteMacro() {
    if (!macroToDelete) return;
    
    try {
      const res = await fetch(`/api/macros/${macroToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (data.success) {
        await loadMacros();
        toastSuccess('Macro deleted successfully');
      } else {
        toastError(data.error || 'Failed to delete macro');
      }
    } catch (error) {
      console.error('Error deleting macro:', error);
      toastError('Failed to delete macro');
    } finally {
      macroToDelete = null;
    }
  }

  function canEditMacro(macro) {
    if (isSoloEdition) {
      return macro.isSystem ? canManageSystem : macro.createdBy === currentUserId;
    }
    if (activeTab === 'system') {
      return canManageSystem;
    }
    return macro.createdBy === currentUserId;
  }

  function canDeleteMacro(macro) {
    if (isSoloEdition) {
      return macro.isSystem ? canManageSystem : macro.createdBy === currentUserId;
    }
    if (activeTab === 'system') {
      return canManageSystem;
    }
    return macro.createdBy === currentUserId;
  }

  function canCreateMacro() {
    if (isSoloEdition) return true;
    if (activeTab === 'system') {
      return canManageSystem;
    }
    return true;
  }

  $: filteredMacros = (() => {
    let filtered = macros;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(macro => macro.category === selectedCategory);
    }
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(macro => 
        macro.name?.toLowerCase().includes(search) ||
        macro.voiceCommand?.toLowerCase().includes(search) ||
        macro.content?.toLowerCase().includes(search)
      );
    }
    
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  })();

  // Reactive statement for create permission
  $: canCreate = isSoloEdition || activeTab !== 'system' || canManageSystem;
</script>

<svelte:head>
  <title>Voice Macros - KrisPoint</title>
  <meta name="description" content="Manage voice-activated macros for faster radiology reporting">
</svelte:head>

{#if !isPremium}
  <div class="macros-page">
    <PremiumGate feature="macros" />
  </div>
{:else}
<div class="macros-page">
    <div class="page-header">
      <p>Voice-activated text snippets for faster reporting</p>
      
      <div class="header-actions">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Search macros..." 
            bind:value={searchTerm}
            class="search-input"
          >
        </div>
        
        <select bind:value={selectedCategory} class="category-filter">
          {#each categories as cat}
            <option value={cat.id}>{cat.icon} {cat.label}</option>
          {/each}
        </select>
        
        {#if canCreate}
          <button class="btn btn-primary" on:click={startAddMacro}>
            <span>+</span>
            Create {isSoloEdition ? '' : activeTab === 'system' ? 'System ' : 'Personal '}Macro
          </button>
        {/if}
      </div>
    </div>
    
    {#if !isSoloEdition}
    <div class="tabs">
      <button 
        class="tab" 
        class:active={activeTab === 'system'}
        on:click={() => switchTab('system')}
      >
        System Macros
      </button>
      <button 
        class="tab" 
        class:active={activeTab === 'personal'}
        on:click={() => switchTab('personal')}
      >
        My Macros
      </button>
    </div>
    {/if}
    
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading macros...</p>
      </div>
    {:else if filteredMacros.length === 0}
      <div class="empty-state">
        <h3>{isSoloEdition ? 'No macros found' : `No ${activeTab} macros found`}</h3>
        <p>
          {#if isSoloEdition}
            Create macros for frequently used reporting text.
          {:else if activeTab === 'system'}
            {#if canManageSystem}
              Create system macros that will be available to all users.
            {:else}
              System macros are managed by administrators. Switch to "My Macros" to create your own.
            {/if}
          {:else}
            Create personal macros for your own use.
          {/if}
        </p>
        {#if canCreate}
          <button class="btn btn-primary" on:click={startAddMacro}>
            Create Macro
          </button>
        {/if}
      </div>
    {:else}
      <div class="macros-grid">
        {#each filteredMacros as macro}
          <div class="macro-card">
            <div class="macro-header">
              <span class="category-icon">{getCategoryIcon(macro.category)}</span>
              <h3>{macro.name}</h3>
            </div>
            
            {#if macro.voiceCommand}
              <div class="voice-command">
                <span class="voice-icon">🎤</span>
                <span class="voice-text">"{macro.voiceCommand}"</span>
              </div>
            {/if}
            
            <div class="macro-content">
              {macro.content.length > 100 ? macro.content.substring(0, 100) + '...' : macro.content}
            </div>
            
            <div class="macro-actions">
              {#if canEditMacro(macro)}
                <button class="btn btn-outline btn-icon" on:click={() => editMacro(macro)} title="Edit macro">
                  ✏️
                </button>
              {/if}
              {#if canDeleteMacro(macro)}
                <button class="btn btn-danger btn-icon" on:click={() => confirmDeleteMacro(macro)} title="Delete macro">
                  🗑️
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

<!-- Add/Edit Macro Modal -->
{#if showAddForm}
  <div class="modal-overlay" on:click={resetForm}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{editingMacro ? 'Edit Macro' : isSoloEdition ? 'Create Macro' : `Create ${activeTab === 'system' ? 'System' : 'Personal'} Macro`}</h3>
        <button class="close-btn" on:click={resetForm}>×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="macroName">Name *</label>
          <input 
            id="macroName"
            type="text" 
            bind:value={newMacro.name}
            placeholder="e.g., Normal Chest"
          >
        </div>
        
        <div class="form-group">
          <label for="macroCategory">Category</label>
          <select id="macroCategory" bind:value={newMacro.category}>
            {#each categories.filter(c => c.id !== 'All') as cat}
              <option value={cat.id}>{cat.icon} {cat.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="macroVoice">Voice Command</label>
          <input 
            id="macroVoice"
            type="text" 
            bind:value={newMacro.voiceCommand}
            placeholder="e.g., normal chest"
          >
          <span class="field-hint">Say this phrase to insert this macro via voice</span>
        </div>
        
        <div class="form-group">
          <label for="macroContent">Content *</label>
          <textarea 
            id="macroContent"
            bind:value={newMacro.content}
            placeholder="Enter the text that will be inserted..."
            rows="6"
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={resetForm}>Cancel</button>
        <button class="btn btn-primary" on:click={saveMacro} disabled={saving}>
          {saving ? 'Saving...' : (editingMacro ? 'Update Macro' : 'Create Macro')}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
  show={showDeleteConfirm}
  title="Delete Macro"
  message="Are you sure you want to delete this macro? This action cannot be undone."
  confirmText="Delete"
  confirmClass="danger"
  on:confirm={deleteMacro}
  on:cancel={() => { showDeleteConfirm = false; macroToDelete = null; }}
/>
{/if}

<style>
  .macros-page {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100vh;
    background: var(--bg-secondary, #f8fafc);
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

  .search-input, .category-filter {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    font-size: 0.9375rem;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1e293b);
  }

  .search-input {
    width: 100%;
  }

  .category-filter {
    min-width: 150px;
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

  .macros-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .macro-card {
    background: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: box-shadow 0.2s;
  }

  .macro-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .macro-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .category-icon {
    font-size: 1.25rem;
  }

  .macro-header h3 {
    font-size: 1rem;
    color: var(--text-primary, #1e293b);
    margin: 0;
    flex: 1;
  }

  .voice-command {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(59, 130, 246, 0.1);
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .voice-icon {
    font-size: 0.875rem;
  }

  .voice-text {
    color: var(--primary-color, #3b82f6);
    font-weight: 500;
  }

  .macro-content {
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
    line-height: 1.5;
    flex: 1;
  }

  .macro-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
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

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .btn-icon {
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
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
    color: var(--text-secondary, #64748b);
  }

  .btn-outline:hover {
    background: var(--bg-secondary, #f1f5f9);
    border-color: var(--primary-color, #3b82f6);
    color: var(--primary-color, #3b82f6);
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

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-theme="dark"]) .btn-outline {
    border-color: #334155;
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .btn-outline:hover {
    background: #334155;
    border-color: var(--primary-color, #3b82f6);
    color: var(--primary-color, #3b82f6);
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
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-weight: 500;
    color: var(--text-primary, #1e293b);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    font-size: 0.9375rem;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1e293b);
  }

  .form-group textarea {
    resize: vertical;
    font-family: inherit;
  }

  .field-hint {
    display: block;
    font-size: 0.75rem;
    color: var(--text-secondary, #64748b);
    margin-top: 0.25rem;
  }

  /* Dark mode */
  :global([data-theme="dark"]) .macros-page {
    background: #0f172a;
  }

  :global([data-theme="dark"]) .page-header p {
    color: #94a3b8;
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

  :global([data-theme="dark"]) .macro-card {
    background: #1e293b;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .macro-header h3 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .macro-actions {
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

  :global([data-theme="dark"]) .form-group label {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .form-group input,
  :global([data-theme="dark"]) .form-group select,
  :global([data-theme="dark"]) .form-group textarea,
  :global([data-theme="dark"]) .search-input,
  :global([data-theme="dark"]) .category-filter {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .macro-content {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .voice-command {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .empty-state h3 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .empty-state p {
    color: #94a3b8;
  }

  @media (max-width: 768px) {
    .macros-grid {
      grid-template-columns: 1fr;
    }
    
    .header-actions {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-box {
      min-width: 100%;
    }
  }
</style>
