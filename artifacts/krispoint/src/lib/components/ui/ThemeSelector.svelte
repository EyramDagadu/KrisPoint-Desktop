<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import { toastSuccess, toastError } from '$lib/utils/toast.js';
  
  // Service reference (will be null during SSR)
  let themeService = null;

  export let isOpen = false;
  export let compact = false;

  let themes = [];
  let currentTheme = null;
  let customThemeName = '';
  let showCustomCreator = false;
  let selectedBaseTheme = 'light';
  let customColors = {};
  let accessibilityInfo = null;
  let showAccessibilityInfo = false;
  let showDeleteThemeConfirm = false;
  let themeToDelete = null;

  onMount(async () => {
    // Import service only in browser
    if (browser) {
      const { themeService: ts } = await import('$lib/services/ThemeService.js');
      themeService = ts;
      
      loadThemes();
      loadAccessibilityInfo();
      
      // Listen for theme changes
      const unsubscribe = themeService.onThemeChange((theme) => {
        currentTheme = theme;
        loadAccessibilityInfo();
      });

      return unsubscribe;
    }
  });

  function loadThemes() {
    if (!themeService) return;
    themes = themeService.getAllThemes();
    currentTheme = themeService.getCurrentTheme();
  }

  function loadAccessibilityInfo() {
    if (!themeService) return;
    accessibilityInfo = themeService.getAccessibilityInfo();
  }

  function selectTheme(themeId) {
    themeService.setTheme(themeId);
    loadThemes();
    if (!compact) {
      isOpen = false;
    }
  }

  function toggleTheme() {
    themeService.toggleTheme();
    loadThemes();
  }

  function createCustomTheme() {
    if (!customThemeName.trim()) return;

    const customizations = {
      colors: customColors
    };

    const themeId = themeService.createCustomTheme(
      selectedBaseTheme,
      customizations,
      customThemeName
    );

    if (themeId) {
      loadThemes();
      selectTheme(themeId);
      resetCustomCreator();
    }
  }

  function resetCustomCreator() {
    showCustomCreator = false;
    customThemeName = '';
    customColors = {};
    selectedBaseTheme = 'light';
  }

  function deleteTheme(themeId, event) {
    event.stopPropagation();
    themeToDelete = themeId;
    showDeleteThemeConfirm = true;
  }

  function confirmDeleteTheme() {
    if (themeToDelete && themeService) {
      themeService.deleteCustomTheme(themeToDelete);
      loadThemes();
      toastSuccess('Theme deleted successfully');
      themeToDelete = null;
    }
  }

  function exportThemes() {
    const data = themeService.exportThemes();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `themes_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importThemes(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (themeService.importThemes(data)) {
          loadThemes();
          toastSuccess('Themes imported successfully!');
        } else {
          toastError('Error importing themes. Please check the file format.');
        }
      } catch (error) {
        toastError('Invalid file format.');
      }
    };
    reader.readAsText(file);
  }

  function getThemePreview(theme) {
    return {
      background: theme.colors.background,
      surface: theme.colors.surface,
      primary: theme.colors.primary,
      text: theme.colors.textPrimary
    };
  }

  function formatContrastRatio(ratio) {
    return ratio ? ratio.toFixed(1) + ':1' : 'Unknown';
  }

  function getContrastLevel(ratio) {
    if (ratio >= 7) return { level: 'AAA', color: '#10b981' };
    if (ratio >= 4.5) return { level: 'AA', color: '#f59e0b' };
    if (ratio >= 3) return { level: 'A', color: '#ef4444' };
    return { level: 'Fail', color: '#dc2626' };
  }

  // Compact theme toggle for header
  if (compact) {
    // Just show current theme indicator and toggle
  }
</script>

{#if compact}
  <!-- Compact Theme Toggle for Header -->
  <div class="theme-toggle-compact">
    <button 
      class="theme-btn compact"
      on:click={toggleTheme}
      title="Toggle theme (Light/Dark)"
    >
      {#if currentTheme?.type === 'dark'}
        🌙
      {:else if currentTheme?.type === 'high-contrast'}
        🔳
      {:else if currentTheme?.type === 'warm'}
        🟡
      {:else}
        ☀️
      {/if}
    </button>
  </div>
{:else if isOpen}
  <!-- Full Theme Selector Panel -->
  <div class="theme-overlay" on:click={() => isOpen = false}>
    <div class="theme-panel" on:click|stopPropagation>
      <!-- Header -->
      <div class="panel-header">
        <div class="header-title">
          <h2>🎨 Theme & Appearance</h2>
          <p>Customize the visual appearance for optimal comfort</p>
        </div>
        <div class="header-actions">
          <button 
            class="toggle-accessibility"
            on:click={() => showAccessibilityInfo = !showAccessibilityInfo}
            title="Toggle accessibility information"
          >
            ♿ Accessibility
          </button>
          <button class="export-btn" on:click={exportThemes}>📤 Export</button>
          <label class="import-btn">
            📥 Import
            <input type="file" accept=".json" on:change={importThemes} style="display: none;" />
          </label>
          <button class="close-btn" on:click={() => isOpen = false}>✕</button>
        </div>
      </div>

      <!-- Accessibility Information -->
      {#if showAccessibilityInfo && accessibilityInfo}
        <div class="accessibility-section">
          <h3>♿ Accessibility Information</h3>
          <div class="accessibility-grid">
            <div class="accessibility-item">
              <span class="label">Contrast Ratio:</span>
              <span class="value">
                {formatContrastRatio(accessibilityInfo.contrastRatio)}
                <span 
                  class="contrast-badge"
                  style="color: {getContrastLevel(accessibilityInfo.contrastRatio).color}"
                >
                  {getContrastLevel(accessibilityInfo.contrastRatio).level}
                </span>
              </span>
            </div>
            <div class="accessibility-item">
              <span class="label">Color Blind Safe:</span>
              <span class="value {accessibilityInfo.colorBlindSafe ? 'good' : 'warning'}">
                {accessibilityInfo.colorBlindSafe ? '✅ Yes' : '⚠️ No'}
              </span>
            </div>
            <div class="accessibility-item">
              <span class="label">Font Size:</span>
              <span class="value">{accessibilityInfo.fontSize}px</span>
            </div>
            <div class="accessibility-item">
              <span class="label">Reduced Motion:</span>
              <span class="value {accessibilityInfo.reducedMotion ? 'good' : 'neutral'}">
                {accessibilityInfo.reducedMotion ? '✅ Enabled' : '➖ Disabled'}
              </span>
            </div>
          </div>
        </div>
      {/if}

      <!-- Theme Selection -->
      <div class="themes-section">
        <h3>Available Themes</h3>
        <div class="themes-grid">
          {#each themes as theme}
            <div 
              class="theme-card {currentTheme?.id === theme.id ? 'active' : ''}"
              on:click={() => selectTheme(theme.id)}
            >
              <div class="theme-preview" style="
                background: {getThemePreview(theme).background};
                border-color: {getThemePreview(theme).primary};
              ">
                <div class="preview-surface" style="background: {getThemePreview(theme).surface};">
                  <div class="preview-text" style="color: {getThemePreview(theme).text};">
                    Sample Text
                  </div>
                  <div class="preview-accent" style="background: {getThemePreview(theme).primary};"></div>
                </div>
              </div>
              
              <div class="theme-info">
                <h4>{theme.name}</h4>
                <div class="theme-meta">
                  <span class="theme-type">{theme.type}</span>
                  {#if theme.isCustom}
                    <button 
                      class="delete-btn"
                      on:click={(e) => deleteTheme(theme.id, e)}
                      title="Delete custom theme"
                    >
                      🗑️
                    </button>
                  {/if}
                </div>
              </div>
              
              {#if currentTheme?.id === theme.id}
                <div class="active-indicator">✓</div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Custom Theme Creator -->
      <div class="custom-section">
        <div class="section-header">
          <h3>Create Custom Theme</h3>
          <button 
            class="toggle-btn {showCustomCreator ? 'active' : ''}"
            on:click={() => showCustomCreator = !showCustomCreator}
          >
            {showCustomCreator ? '−' : '+'}
          </button>
        </div>

        {#if showCustomCreator}
          <div class="custom-creator">
            <div class="creator-form">
              <div class="form-group">
                <label>Theme Name:</label>
                <input 
                  type="text" 
                  bind:value={customThemeName}
                  placeholder="My Custom Theme"
                />
              </div>
              
              <div class="form-group">
                <label>Base Theme:</label>
                <select bind:value={selectedBaseTheme}>
                  {#each themes.filter(t => !t.isCustom) as theme}
                    <option value={theme.id}>{theme.name}</option>
                  {/each}
                </select>
              </div>
              
              <div class="color-customization">
                <h4>Color Customization</h4>
                <div class="color-grid">
                  <div class="color-group">
                    <label>Primary Color:</label>
                    <input 
                      type="color" 
                      bind:value={customColors.primary}
                      placeholder={themes.find(t => t.id === selectedBaseTheme)?.colors.primary}
                    />
                  </div>
                  <div class="color-group">
                    <label>Background:</label>
                    <input 
                      type="color" 
                      bind:value={customColors.background}
                      placeholder={themes.find(t => t.id === selectedBaseTheme)?.colors.background}
                    />
                  </div>
                  <div class="color-group">
                    <label>Text Color:</label>
                    <input 
                      type="color" 
                      bind:value={customColors.textPrimary}
                      placeholder={themes.find(t => t.id === selectedBaseTheme)?.colors.textPrimary}
                    />
                  </div>
                  <div class="color-group">
                    <label>Surface Color:</label>
                    <input 
                      type="color" 
                      bind:value={customColors.surface}
                      placeholder={themes.find(t => t.id === selectedBaseTheme)?.colors.surface}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div class="creator-actions">
              <button class="cancel-btn" on:click={resetCustomCreator}>Cancel</button>
              <button 
                class="create-btn" 
                on:click={createCustomTheme}
                disabled={!customThemeName.trim()}
              >
                Create Theme
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="actions-grid">
          <button class="action-btn" on:click={() => selectTheme('light')}>
            ☀️ Light Mode
          </button>
          <button class="action-btn" on:click={() => selectTheme('dark')}>
            🌙 Dark Mode
          </button>
          <button class="action-btn" on:click={() => selectTheme('highContrast')}>
            🔳 High Contrast
          </button>
          <button class="action-btn" on:click={() => selectTheme('eyeComfort')}>
            👁️ Eye Comfort
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Compact Theme Toggle */
  .theme-toggle-compact {
    display: flex;
    align-items: center;
  }

  .theme-btn.compact {
    padding: 0.5rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    background: var(--color-surface, white);
    cursor: pointer;
    font-size: 1.125rem;
    transition: all 0.2s;
  }

  .theme-btn.compact:hover {
    background: var(--color-surface-hover, #f9fafb);
    transform: scale(1.05);
  }

  /* Full Theme Panel */
  .theme-overlay {
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

  .theme-panel {
    background: var(--color-surface, white);
    width: 90vw;
    max-width: 900px;
    height: 85vh;
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-background-secondary, #f9fafb);
  }

  .header-title h2 {
    margin: 0 0 0.25rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 1.5rem;
  }

  .header-title p {
    margin: 0;
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.875rem;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .toggle-accessibility, .export-btn, .import-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 0.375rem;
    background: var(--color-surface, white);
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
    color: var(--color-text-primary);
  }

  .toggle-accessibility:hover, .export-btn:hover, .import-btn:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-muted, #6b7280);
    padding: 0.5rem;
    border-radius: 0.375rem;
  }

  .close-btn:hover {
    background: var(--color-surface-hover, #f3f4f6);
    color: var(--color-text-primary, #374151);
  }

  .accessibility-section {
    padding: 1rem 1.5rem;
    background: var(--color-background-secondary, #f9fafb);
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .accessibility-section h3 {
    margin: 0 0 0.75rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 1rem;
  }

  .accessibility-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .accessibility-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: var(--color-surface, white);
    border-radius: 0.375rem;
    border: 1px solid var(--color-border, #e5e7eb);
  }

  .accessibility-item .label {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #4b5563);
    font-weight: 500;
  }

  .accessibility-item .value {
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .contrast-badge {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }

  .value.good { color: #10b981; }
  .value.warning { color: #f59e0b; }
  .value.neutral { color: var(--color-text-muted); }

  .themes-section {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
  }

  .themes-section h3 {
    margin: 0 0 1rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 1rem;
  }

  .themes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .theme-card {
    position: relative;
    border: 2px solid transparent;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.3s;
    overflow: hidden;
    background: var(--color-surface, white);
  }

  .theme-card:hover {
    border-color: var(--color-primary, #3b82f6);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .theme-card.active {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: var(--shadow-lg);
  }

  .theme-preview {
    height: 80px;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin: 0.75rem;
    border: 1px solid;
    position: relative;
    overflow: hidden;
  }

  .preview-surface {
    height: 100%;
    border-radius: 0.375rem;
    padding: 0.5rem;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .preview-text {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .preview-accent {
    width: 30px;
    height: 4px;
    border-radius: 2px;
    align-self: flex-end;
  }

  .theme-info {
    padding: 0.75rem;
  }

  .theme-info h4 {
    margin: 0 0 0.25rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 0.875rem;
  }

  .theme-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .theme-type {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    text-transform: capitalize;
  }

  .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .active-indicator {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: var(--color-primary, #3b82f6);
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .custom-section {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-background-secondary, #f9fafb);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h3 {
    margin: 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 1rem;
  }

  .toggle-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 0.375rem;
    background: var(--color-surface, white);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }

  .toggle-btn.active {
    background: var(--color-primary, #3b82f6);
    color: white;
  }

  .custom-creator {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .creator-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary, #374151);
  }

  .form-group input, .form-group select {
    padding: 0.5rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 0.375rem;
    background: var(--color-surface, white);
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }

  .color-customization h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 0.875rem;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  .color-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .color-group label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #6b7280);
  }

  .color-group input[type="color"] {
    height: 40px;
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .creator-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .cancel-btn, .create-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .cancel-btn {
    background: var(--color-surface, white);
    border: 1px solid var(--color-border, #d1d5db);
    color: var(--color-text-primary);
  }

  .cancel-btn:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }

  .create-btn {
    background: var(--color-primary, #3b82f6);
    border: 1px solid var(--color-primary, #3b82f6);
    color: white;
  }

  .create-btn:hover:not(:disabled) {
    background: var(--color-primary-hover, #2563eb);
  }

  .create-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quick-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .quick-actions h3 {
    margin: 0 0 0.75rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 1rem;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.75rem 0.5rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 0.5rem;
    background: var(--color-surface, white);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    text-align: center;
    color: var(--color-text-primary);
  }

  .action-btn:hover {
    background: var(--color-surface-hover, #f3f4f6);
    border-color: var(--color-primary, #3b82f6);
    transform: translateY(-1px);
  }
</style>

<ConfirmDialog
  bind:show={showDeleteThemeConfirm}
  title="Delete Custom Theme?"
  message="Are you sure you want to delete this custom theme? This cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  danger={true}
  on:confirm={confirmDeleteTheme}
/>