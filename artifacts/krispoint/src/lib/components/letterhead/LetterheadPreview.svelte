<script>
    export let letterhead;
    import { letterheadStore, letterheadActions } from '../../stores/letterheadStore.js';
    
    let previewContainer;
    
    // Sample report content for preview
    const sampleContent = `MEDICAL IMAGING REPORT

Patient: John Doe
Date: ${new Date().toLocaleDateString()}
Study: Chest X-ray

FINDINGS:
The cardiac silhouette is normal in size and configuration. The mediastinal contours are within normal limits. The lung fields are clear bilaterally with no evidence of infiltrate, effusion, or pneumothorax.

IMPRESSION:
Normal chest radiograph.

Dr. Sarah Johnson, MD
Radiologist`;
</script>

<div class="letterhead-preview">
    <h4>📄 PDF Preview</h4>
    <p class="preview-description">Preview how your letterhead will appear on medical reports</p>
    
    <div class="preview-layout">
        <div class="preview-container" bind:this={previewContainer}>
            <!-- Letterhead at top (only if position is 'top') -->
            {#if $letterheadStore.settings.position === 'top'}
                <div class="letterhead-section" style="height: {$letterheadStore.settings.height}px; margin-top: {$letterheadStore.settings.topMargin}px;">
                    <img 
                        src={letterhead.url} 
                        alt={letterhead.name}
                        class="letterhead-image"
                        style="
                            opacity: {$letterheadStore.settings.opacity};
                            max-height: {$letterheadStore.settings.height}px;
                            margin-left: {$letterheadStore.settings.margin}px;
                            margin-right: {$letterheadStore.settings.margin}px;
                        "
                    />
                </div>
            {/if}
            
            <!-- Sample report content -->
            <div class="report-content" style="margin: {$letterheadStore.settings.margin}px;">
                <pre class="report-text">{sampleContent}</pre>
            </div>
            
            <!-- Letterhead at bottom (only if position is 'bottom') -->
            {#if $letterheadStore.settings.position === 'bottom'}
                <div class="letterhead-footer" style="height: {$letterheadStore.settings.height}px;">
                    <img 
                        src={letterhead.url} 
                        alt={letterhead.name}
                        class="letterhead-image"
                        style="
                            opacity: {$letterheadStore.settings.opacity};
                            max-height: {$letterheadStore.settings.height}px;
                            margin: {$letterheadStore.settings.margin}px;
                        "
                    />
                </div>
            {/if}
        </div>
        
        <!-- Settings Panel -->
    <div class="settings-panel">
        <h5>⚙️ Letterhead Settings</h5>
        
        <div class="setting-group">
            <label for="height-slider">Height: {$letterheadStore.settings.height}px</label>
            <input 
                id="height-slider"
                type="range" 
                min="60" 
                max="200" 
                bind:value={$letterheadStore.settings.height}
                on:input={() => letterheadActions.saveToStorage()}
                class="slider"
            />
        </div>
        
        <div class="setting-group">
            <label for="opacity-slider">Opacity: {Math.round($letterheadStore.settings.opacity * 100)}%</label>
            <input 
                id="opacity-slider"
                type="range" 
                min="0.3" 
                max="1" 
                step="0.1" 
                bind:value={$letterheadStore.settings.opacity}
                on:input={() => letterheadActions.saveToStorage()}
                class="slider"
            />
        </div>
        
        <div class="setting-group">
            <label for="margin-slider">Side Margin: {$letterheadStore.settings.margin}px</label>
            <input 
                id="margin-slider"
                type="range" 
                min="10" 
                max="50" 
                bind:value={$letterheadStore.settings.margin}
                on:input={() => letterheadActions.saveToStorage()}
                class="slider"
            />
        </div>
        
        <div class="setting-group">
            <label for="top-margin-slider">Top Margin: {$letterheadStore.settings.topMargin}px</label>
            <input 
                id="top-margin-slider"
                type="range" 
                min="0" 
                max="60" 
                bind:value={$letterheadStore.settings.topMargin}
                on:input={() => letterheadActions.saveToStorage()}
                class="slider"
            />
        </div>
        
        <div class="setting-group">
            <label for="position-select">Position:</label>
            <select 
                id="position-select"
                bind:value={$letterheadStore.settings.position}
                on:change={() => letterheadActions.saveToStorage()}
                class="position-select"
            >
                <option value="top">Top of page</option>
                <option value="bottom">Bottom of page</option>
            </select>
        </div>
    </div>
    </div>
</div>

<style>
    .letterhead-preview {
        background: var(--background-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
    }
    
    .letterhead-preview h4 {
        color: var(--text-primary);
        margin-bottom: 8px;
        font-size: 1.1rem;
    }
    
    .preview-description {
        color: var(--text-secondary);
        margin-bottom: 20px;
        font-size: 0.9rem;
    }
    
    .preview-layout {
        display: flex;
        gap: 20px;
        align-items: flex-start;
    }
    
    .preview-container {
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        min-height: 400px;
        flex: 1;
        display: flex;
        flex-direction: column;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .letterhead-section {
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }
    
    .letterhead-footer {
        background: #f8f9fa;
        border-top: 1px solid #e9ecef;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-top: auto;
    }
    
    .letterhead-image {
        max-width: calc(100% - 40px);
        object-fit: contain;
        display: block;
    }
    
    .report-content {
        flex: 1;
        padding: 20px;
        overflow: hidden;
    }
    
    .report-text {
        font-family: 'Times New Roman', serif;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
        white-space: pre-wrap;
        margin: 0;
    }
    
    .settings-panel {
        background: var(--background-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        flex: 0 0 280px;
        padding: 16px;
    }
    
    .settings-panel h5 {
        color: var(--text-primary);
        margin-bottom: 16px;
        font-size: 1rem;
    }
    
    .setting-group {
        margin-bottom: 16px;
    }
    
    .setting-group label {
        display: block;
        color: var(--text-primary);
        margin-bottom: 6px;
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--background-secondary);
        outline: none;
        -webkit-appearance: none;
    }
    
    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--color-primary);
        cursor: pointer;
    }
    
    .slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--color-primary);
        cursor: pointer;
        border: none;
    }
    
    .position-select {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--background-primary);
        color: var(--text-primary);
        font-size: 0.9rem;
    }
    
    .position-select:focus {
        outline: none;
        border-color: var(--color-primary);
    }
</style>