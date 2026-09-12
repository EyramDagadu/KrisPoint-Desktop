<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { toastSuccess, toastError } from '$lib/utils/toast.js';
  
  // Service reference (will be null during SSR)
  let keyboardShortcutService = null;

  export let isOpen = false;

  let shortcutCategories = {};
  let usageStats = {};
  let searchQuery = '';
  let selectedCategory = 'all';
  let customizingShortcut = null;
  let newShortcutKey = '';

  onMount(async () => {
    // Import service only in browser
    if (browser) {
      const { keyboardShortcutService: kss } = await import('$lib/services/KeyboardShortcutService.js');
      keyboardShortcutService = kss;
      
      loadShortcuts();
      loadUsageStats();
      setupKeyboardService();
    }
  });

  function loadShortcuts() {
    if (!keyboardShortcutService) return;
    shortcutCategories = keyboardShortcutService.getShortcutsByCategory();
  }

  function loadUsageStats() {
    if (!keyboardShortcutService) return;
    usageStats = keyboardShortcutService.getUsageStatistics();
  }

  function setupKeyboardService() {
    // Set up keyboard shortcut handlers
    keyboardShortcutService.on('showHelp', () => {
      isOpen = true;
    });

    keyboardShortcutService.on('closeModal', () => {
      if (isOpen) {
        isOpen = false;
      }
    });
  }

  function getFilteredShortcuts() {
    let shortcuts = [];
    
    if (selectedCategory === 'all') {
      shortcuts = Object.values(shortcutCategories).flat();
    } else {
      shortcuts = shortcutCategories[selectedCategory] || [];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      shortcuts = shortcuts.filter(shortcut => 
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.key.toLowerCase().includes(query)
      );
    }

    return shortcuts;
  }

  function startCustomizing(shortcut) {
    customizingShortcut = shortcut;
    newShortcutKey = shortcut.key;
  }

  function saveCustomization() {
    if (customizingShortcut && newShortcutKey && newShortcutKey !== customizingShortcut.key) {
      const success = keyboardShortcutService.customizeShortcut(
        customizingShortcut.key,
        newShortcutKey,
        customizingShortcut.description
      );
      
      if (success) {
        loadShortcuts();
        customizingShortcut = null;
        newShortcutKey = '';
      } else {
        toastError('Failed to update shortcut. The key combination might already be in use.');
      }
    } else {
      cancelCustomization();
    }
  }

  function cancelCustomization() {
    customizingShortcut = null;
    newShortcutKey = '';
  }

  function toggleShortcut(shortcut) {
    if (shortcut.enabled) {
      keyboardShortcutService.disableShortcut(shortcut.key);
    } else {
      keyboardShortcutService.enableShortcut(shortcut.key);
    }
    loadShortcuts();
  }

  function exportShortcuts() {
    const data = keyboardShortcutService.exportShortcuts();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortcuts_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importShortcuts(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (keyboardShortcutService.importShortcuts(data)) {
          loadShortcuts();
          toastSuccess('Shortcuts imported successfully!');
        } else {
          toastError('Error importing shortcuts. Please check the file format.');
        }
      } catch (error) {
        toastError('Invalid file format.');
      }
    };
    reader.readAsText(file);
  }

  function formatKey(key) {
    return key.split('+')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' + ');
  }

  function getKeyIcon(key) {
    const icons = {
      'ctrl': '⌃',
      'alt': '⌥',
      'shift': '⇧',
      'enter': '↵',
      'tab': '⇥',
      'space': '␣',
      'escape': '⎋',
      'backspace': '⌫'
    };
    return icons[key.toLowerCase()] || key.toUpperCase();
  }

  // Reactive statements
  $: filteredShortcuts = getFilteredShortcuts();
</script>

{#if isOpen}
<div class="shortcuts-overlay" on:click={() => isOpen = false}>
  <div class="shortcuts-panel" on:click|stopPropagation>
    <!-- Header -->
    <div class="panel-header">
      <div class="header-title">
        <h2>⌨️ Keyboard Shortcuts</h2>
        <p>Customize and manage keyboard shortcuts for faster workflow</p>
      </div>
      <div class="header-actions">
        <button class="export-btn" on:click={exportShortcuts} title="Export shortcuts">
          📤 Export
        </button>
        <label class="import-btn" title="Import shortcuts">
          📥 Import
          <input type="file" accept=".json" on:change={importShortcuts} style="display: none;" />
        </label>
        <button class="close-btn" on:click={() => isOpen = false}>✕</button>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="search-section">
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Search shortcuts..." 
          bind:value={searchQuery}
          class="search-input"
        />
        <select bind:value={selectedCategory} class="category-filter">
          <option value="all">All Categories</option>
          {#each Object.keys(shortcutCategories) as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Usage Statistics -->
    {#if usageStats.mostUsed && usageStats.mostUsed.length > 0}
      <div class="stats-section">
        <h3>📊 Most Used Shortcuts</h3>
        <div class="stats-grid">
          {#each usageStats.mostUsed.slice(0, 5) as stat}
            <div class="stat-item">
              <div class="stat-key">{formatKey(stat.shortcut)}</div>
              <div class="stat-desc">{stat.description}</div>
              <div class="stat-count">{stat.count} uses</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Shortcuts List -->
    <div class="shortcuts-content">
      {#if filteredShortcuts.length === 0}
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No shortcuts found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      {:else}
        <div class="shortcuts-list">
          {#each filteredShortcuts as shortcut}
            <div class="shortcut-item {!shortcut.enabled ? 'disabled' : ''}">
              <div class="shortcut-info">
                <div class="shortcut-keys">
                  {#if customizingShortcut && customizingShortcut.key === shortcut.key}
                    <input 
                      type="text" 
                      bind:value={newShortcutKey}
                      placeholder="Press keys..."
                      class="key-input"
                      on:keydown={(e) => {
                        e.preventDefault();
                        const parts = [];
                        if (e.ctrlKey) parts.push('ctrl');
                        if (e.altKey) parts.push('alt');
                        if (e.shiftKey) parts.push('shift');
                        if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
                          parts.push(e.key.toLowerCase());
                        }
                        newShortcutKey = parts.join('+');
                      }}
                    />
                  {:else}
                    {#each shortcut.key.split('+') as key}
                      <span class="key-badge">{getKeyIcon(key)}</span>
                    {/each}
                  {/if}
                </div>
                <div class="shortcut-description">
                  {shortcut.description}
                </div>
              </div>
              
              <div class="shortcut-actions">
                {#if customizingShortcut && customizingShortcut.key === shortcut.key}
                  <button class="save-btn" on:click={saveCustomization}>💾</button>
                  <button class="cancel-btn" on:click={cancelCustomization}>✕</button>
                {:else}
                  <button 
                    class="toggle-btn {shortcut.enabled ? 'enabled' : 'disabled'}"
                    on:click={() => toggleShortcut(shortcut)}
                    title={shortcut.enabled ? 'Disable shortcut' : 'Enable shortcut'}
                  >
                    {shortcut.enabled ? '🟢' : '🔴'}
                  </button>
                  <button 
                    class="edit-btn" 
                    on:click={() => startCustomizing(shortcut)}
                    title="Customize shortcut"
                  >
                    ✏️
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Quick Tips -->
    <div class="tips-section">
      <h3>💡 Quick Tips</h3>
      <div class="tips-grid">
        <div class="tip-item">
          <strong>F1</strong> - Open this help panel anytime
        </div>
        <div class="tip-item">
          <strong>Ctrl + S</strong> - Save current report
        </div>
        <div class="tip-item">
          <strong>Ctrl + 1-4</strong> - Navigate between sections
        </div>
        <div class="tip-item">
          <strong>Ctrl + Shift + V</strong> - Toggle voice recognition
        </div>
        <div class="tip-item">
          <strong>Escape</strong> - Close dialogs and modals
        </div>
        <div class="tip-item">
          <strong>Tab</strong> - Move to next section
        </div>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .shortcuts-overlay {
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

  .shortcuts-panel {
    background: white;
    width: 90vw;
    max-width: 1000px;
    height: 85vh;
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .header-title h2 {
    margin: 0 0 0.25rem 0;
    color: #1f2937;
    font-size: 1.5rem;
  }

  .header-title p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .export-btn, .import-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .export-btn:hover, .import-btn:hover {
    background: #f3f4f6;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.5rem;
    border-radius: 0.375rem;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .search-section {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .search-bar {
    display: flex;
    gap: 1rem;
  }

  .search-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .category-filter {
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: white;
    font-size: 0.875rem;
    min-width: 150px;
  }

  .stats-section {
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .stats-section h3 {
    margin: 0 0 0.75rem 0;
    color: #1f2937;
    font-size: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .stat-item {
    background: white;
    padding: 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
  }

  .stat-key {
    font-family: monospace;
    font-weight: 600;
    color: #3b82f6;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .stat-desc {
    font-size: 0.75rem;
    color: #4b5563;
    margin-bottom: 0.25rem;
  }

  .stat-count {
    font-size: 0.7rem;
    color: #6b7280;
  }

  .shortcuts-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: #374151;
  }

  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    transition: all 0.2s;
  }

  .shortcut-item:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .shortcut-item.disabled {
    opacity: 0.6;
    background: #f9fafb;
  }

  .shortcut-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .shortcut-keys {
    display: flex;
    gap: 0.25rem;
    align-items: center;
    min-width: 120px;
  }

  .key-badge {
    background: #f3f4f6;
    color: #374151;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid #d1d5db;
  }

  .key-input {
    padding: 0.25rem 0.5rem;
    border: 1px solid #3b82f6;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.75rem;
    min-width: 120px;
  }

  .shortcut-description {
    color: #374151;
    font-size: 0.875rem;
  }

  .shortcut-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .toggle-btn, .edit-btn, .save-btn, .cancel-btn {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn:hover, .edit-btn:hover {
    background: #f3f4f6;
  }

  .save-btn {
    background: #10b981;
    color: white;
    border-color: #10b981;
  }

  .save-btn:hover {
    background: #059669;
  }

  .cancel-btn {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
  }

  .cancel-btn:hover {
    background: #dc2626;
  }

  .tips-section {
    padding: 1rem 1.5rem;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  .tips-section h3 {
    margin: 0 0 0.75rem 0;
    color: #1f2937;
    font-size: 1rem;
  }

  .tips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.5rem;
  }

  .tip-item {
    font-size: 0.75rem;
    color: #4b5563;
  }

  .tip-item strong {
    font-family: monospace;
    background: #e5e7eb;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    margin-right: 0.5rem;
  }
</style>