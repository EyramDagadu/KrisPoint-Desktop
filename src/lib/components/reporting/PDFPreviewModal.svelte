<script>
  import { professionalPDFService } from '$lib/services/ProfessionalPDFService.js';
  import CustomPDFViewer from './CustomPDFViewer.svelte';
  import { currentUser } from '$lib/stores/authStore.js';
  import { patientData, reportData } from '$lib/stores/reportStore.js';
  import { letterheadActions } from '$lib/stores/letterheadStore.js';
  
  export let isOpen = false;
  export let onClose = () => {};
  export let onExportSuccess = (filename) => {};
  export let onExportError = (error) => {};
  
  let fontScale = 1.0;
  let lineSpacing = 1.0;
  let selectedFont = 'liberation'; // Default to Liberation Sans (Arial-like)
  let lastGeneratedScale = 1.0;
  let lastGeneratedSpacing = 1.0;
  let lastGeneratedFont = 'liberation';
  let pdfData = null;
  let isGenerating = false;
  let isExporting = false;
  let error = '';
  let scaleDebounceTimeout = null;
  let letterheadLoaded = false;
  
  // Load letterhead from server and generate preview when modal opens
  $: if (isOpen && !pdfData && !isGenerating) {
    loadLetterheadAndPreview();
  }
  
  async function loadSignedAddendums() {
    const currentReportId = $reportData?.databaseReportId;
    if (!currentReportId) {
      professionalPDFService.setSignedAddendums([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/reports/${currentReportId}/addendums`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        const signedAddendums = data.addendums.filter(a => a.status === 'SIGNED');
        professionalPDFService.setSignedAddendums(signedAddendums);
        console.log('📝 Loaded', signedAddendums.length, 'signed addendums for PDF');
      } else {
        professionalPDFService.setSignedAddendums([]);
      }
    } catch (err) {
      console.error('Failed to load addendums for PDF:', err);
      professionalPDFService.setSignedAddendums([]);
    }
  }
  
  async function loadLetterheadAndPreview() {
    if (!letterheadLoaded) {
      await letterheadActions.loadFromServer();
      letterheadLoaded = true;
    }
    await loadSignedAddendums();
    generatePreview(1.0, 1.0, selectedFont);
  }
  
  async function generatePreview(scale = 1.0, spacing = 1.0, font = 'liberation') {
    console.log('🎬 generatePreview called with scale:', scale, 'spacing:', spacing, 'font:', font);
    try {
      isGenerating = true;
      error = '';
      
      // Validate specialist name for residents
      if ($currentUser?.designation === 'Resident' && !$patientData.specialistName?.trim()) {
        error = 'Specialist name is required for resident reports. Please add specialist information in the patient header.';
        isGenerating = false;
        return;
      }
      
      console.log('🎬 Calling professionalPDFService.generateMedicalReport...');
      const pdfBytes = await professionalPDFService.generateMedicalReport(scale, spacing, font);
      console.log('🎬 generateMedicalReport returned', pdfBytes?.length || 0, 'bytes');
      pdfData = pdfBytes;
      lastGeneratedScale = scale;
      lastGeneratedSpacing = spacing;
      lastGeneratedFont = font;
      isGenerating = false;
    } catch (err) {
      console.error('Preview generation failed:', err);
      error = 'Failed to generate preview';
      isGenerating = false;
    }
  }
  
  async function handleExportPDF() {
    console.log('🚀 handleExportPDF called - starting export process');
    try {
      // Validate specialist name for residents BEFORE export
      if ($currentUser?.designation === 'Resident' && !$patientData.specialistName?.trim()) {
        onExportError('Specialist name is required for resident reports. Please add specialist information in the patient header.');
        return;
      }
      
      isExporting = true;
      console.log('🚀 isExporting set to true');
      const scaleDiff = Math.abs(fontScale - lastGeneratedScale);
      const spacingDiff = Math.abs(lineSpacing - lastGeneratedSpacing);
      const fontChanged = selectedFont !== lastGeneratedFont;
      console.log('🚀 Font scale diff:', scaleDiff, 'Spacing diff:', spacingDiff, 'Font changed:', fontChanged);
      
      // Regenerate PDF if scale, spacing, or font has changed
      if (scaleDiff > 0.01 || spacingDiff > 0.01 || fontChanged) {
        console.log('🚀 Regenerating preview at scale:', fontScale, 'spacing:', lineSpacing, 'font:', selectedFont);
        await generatePreview(fontScale, lineSpacing, selectedFont);
        console.log('🚀 Preview regeneration complete');
      }
      
      console.log('🚀 Calling exportToPDF with scale:', fontScale, 'spacing:', lineSpacing, 'font:', selectedFont);
      const result = await professionalPDFService.exportToPDF(fontScale, lineSpacing, selectedFont);
      console.log('🚀 exportToPDF returned:', result);
      
      if (result.success) {
        onExportSuccess(result.filename);
        handleClose();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('PDF export failed:', err);
      onExportError(err.message);
    } finally {
      isExporting = false;
    }
  }
  
  function handleClose() {
    if (scaleDebounceTimeout) {
      clearTimeout(scaleDebounceTimeout);
    }
    pdfData = null;
    fontScale = 1.0;
    lineSpacing = 1.0;
    selectedFont = 'liberation';
    lastGeneratedScale = 1.0;
    lastGeneratedSpacing = 1.0;
    lastGeneratedFont = 'liberation';
    letterheadLoaded = false;
    onClose();
  }
  
  function handleFontScaleInput() {
    // Round fontScale to clean values (remove floating point oddities)
    fontScale = Math.round(fontScale * 100) / 100;
    regenerateOnChange();
  }
  
  function handleLineSpacingInput() {
    // Round lineSpacing to clean values (remove floating point oddities)
    lineSpacing = Math.round(lineSpacing * 100) / 100;
    regenerateOnChange();
  }
  
  function handleFontChange() {
    // Font change immediately triggers regeneration (no debounce needed for dropdown)
    if (selectedFont !== lastGeneratedFont) {
      generatePreview(fontScale, lineSpacing, selectedFont);
    }
  }
  
  function regenerateOnChange() {
    // Debounce PDF regeneration - regenerate directly without CSS preview
    if (scaleDebounceTimeout) {
      clearTimeout(scaleDebounceTimeout);
    }
    
    scaleDebounceTimeout = setTimeout(() => {
      // Regenerate PDF after user stops adjusting if scale, spacing, or font has changed
      const scaleDiff = Math.abs(fontScale - lastGeneratedScale);
      const spacingDiff = Math.abs(lineSpacing - lastGeneratedSpacing);
      const fontChanged = selectedFont !== lastGeneratedFont;
      if (scaleDiff > 0.01 || spacingDiff > 0.01 || fontChanged) {
        generatePreview(fontScale, lineSpacing, selectedFont);
      }
    }, 300); // Slightly longer debounce for smoother experience
  }
  
  function handlePrint() {
    if (!pdfData) return;
    
    // Create a blob URL from the PDF data and open in new window for printing
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Open PDF in new window and trigger print
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  }
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={handleClose}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>PDF Preview</h2>
        <div class="header-actions">
          <button 
            class="btn btn-print" 
            on:click={handlePrint}
            disabled={!pdfData || isGenerating}
            title="Print this report"
          >
            🖨️ Print
          </button>
          <button 
            class="btn btn-export" 
            on:click={handleExportPDF}
            disabled={isExporting || isGenerating}
          >
            {#if isExporting}
              ⏳ Exporting...
            {:else}
              📄 Export PDF
            {/if}
          </button>
          <button class="close-button" on:click={handleClose}>&times;</button>
        </div>
      </div>
      
      <div class="controls">
        <div class="control-group">
          <label for="font-family">Font:</label>
          <select 
            id="font-family"
            bind:value={selectedFont}
            on:change={handleFontChange}
          >
            <option value="liberation">Liberation Sans (Arial-like)</option>
            <option value="noto">Noto Sans (Modern)</option>
            <option value="source">Source Sans Pro (Adobe)</option>
            <option value="dejavu">DejaVu Sans</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="font-scale">Font Size:</label>
          <input 
            id="font-scale"
            type="range" 
            min="0.70" 
            max="1.30" 
            step="0.05"
            bind:value={fontScale}
            on:input={handleFontScaleInput}
          />
          <span class="control-value">{Math.round(fontScale * 100)}%</span>
        </div>
        
        <div class="control-group">
          <label for="line-spacing">Line Spacing:</label>
          <input 
            id="line-spacing"
            type="range" 
            min="0.70" 
            max="1.50" 
            step="0.05"
            bind:value={lineSpacing}
            on:input={handleLineSpacingInput}
          />
          <span class="control-value">{Math.round(lineSpacing * 100)}%</span>
        </div>
        
        <span class="hint">Adjust to fit on one page</span>
      </div>
      
      <!-- Keep viewer alive and overlay loading/error states -->
      <div class="pdf-container">
        {#if pdfData}
          <div class="pdf-viewer">
            <CustomPDFViewer pdfData={pdfData} disableFitToWidth={true} />
          </div>
        {/if}
        
        {#if isGenerating}
          <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Generating preview...</p>
          </div>
        {/if}
        
        {#if error && !isGenerating}
          <div class="error-overlay">
            <p>{error}</p>
            <button on:click={() => generatePreview(fontScale)}>Try Again</button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }
  
  .modal-content {
    background: var(--surface, #ffffff);
    border-radius: 12px;
    width: 90%;
    max-width: 1200px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text-primary, #111827);
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-export {
    background: var(--primary, #3b82f6);
    color: white;
  }
  
  .btn-export:hover:not(:disabled) {
    background: var(--primary-dark, #2563eb);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  
  .btn-export:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-print {
    background: var(--surface-secondary, #f9fafb);
    color: var(--text-primary, #111827);
    border: 1px solid var(--border, #e5e7eb);
  }
  
  .btn-print:hover:not(:disabled) {
    background: var(--surface-hover, #f3f4f6);
    border-color: var(--primary, #3b82f6);
    color: var(--primary, #3b82f6);
  }
  
  .btn-print:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--text-secondary, #6b7280);
    cursor: pointer;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
  }
  
  .close-button:hover {
    background: var(--surface-hover, #f3f4f6);
    color: var(--text-primary, #111827);
  }
  
  .controls {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
    background: var(--surface-secondary, #f9fafb);
    flex-wrap: wrap;
  }
  
  .control-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .control-group label {
    font-size: 0.875rem;
    color: var(--text-primary, #111827);
    font-weight: 500;
    white-space: nowrap;
  }
  
  .control-group select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 6px;
    background: var(--surface, white);
    color: var(--text-primary, #111827);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 200px;
  }
  
  .control-group select:hover {
    border-color: var(--primary, #3b82f6);
  }
  
  .control-group select:focus {
    outline: none;
    border-color: var(--primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .control-group input[type="range"] {
    width: 200px;
    height: 6px;
    border-radius: 3px;
    background: var(--border, #e5e7eb);
    outline: none;
    -webkit-appearance: none;
  }
  
  .pdf-container {
    flex: 1;
    overflow: auto;
    position: relative;
    background: var(--background, #f9fafb);
  }
  
  .control-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary, #3b82f6);
    border: 2px solid var(--surface, white);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .control-group input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  }
  
  .control-group input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary, #3b82f6);
    border: 2px solid var(--surface, white);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .control-group input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  }
  
  .control-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--primary, #3b82f6);
    min-width: 45px;
    text-align: center;
  }
  
  .hint {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--text-secondary, #6b7280);
    font-style: italic;
    white-space: nowrap;
  }
  
  .pdf-viewer {
    flex: 1;
    overflow: hidden;
  }
  
  .loading-overlay, .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(2px);
  }
  
  .loading, .error {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border, #e5e7eb);
    border-top-color: var(--primary, #3b82f6);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .loading p, .error p {
    margin: 0;
    color: var(--text-secondary, #6b7280);
  }
  
  .error button {
    padding: 0.5rem 1rem;
    background: var(--primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .error button:hover {
    background: var(--primary-hover, #2563eb);
  }

  /* Dark theme overrides */
  :global([data-theme="dark"]) .modal-content {
    background: #1e293b;
  }

  :global([data-theme="dark"]) .modal-header {
    border-bottom-color: #475569;
  }

  :global([data-theme="dark"]) .modal-header h2 {
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .close-button {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .close-button:hover {
    background: #334155;
    color: #f1f5f9;
  }

  :global([data-theme="dark"]) .controls {
    background: #1e293b;
    border-bottom-color: #475569;
  }

  :global([data-theme="dark"]) .control-group label {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .control-group select {
    background: #1e293b;
    border-color: #475569;
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .control-group select option {
    background: #1e293b;
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .control-group input[type="range"] {
    background: #475569;
  }

  :global([data-theme="dark"]) .control-group input[type="range"]::-webkit-slider-thumb {
    border-color: #1e293b;
  }

  :global([data-theme="dark"]) .control-group input[type="range"]::-moz-range-thumb {
    border-color: #1e293b;
  }

  :global([data-theme="dark"]) .hint {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .btn-print {
    background: #334155;
    color: #e2e8f0;
    border-color: #475569;
  }

  :global([data-theme="dark"]) .btn-print:hover:not(:disabled) {
    background: #475569;
  }

  :global([data-theme="dark"]) .pdf-container {
    background: #0f172a;
  }

  :global([data-theme="dark"]) .loading-overlay,
  :global([data-theme="dark"]) .error-overlay {
    background: rgba(15, 23, 42, 0.95);
  }

  :global([data-theme="dark"]) .loading p,
  :global([data-theme="dark"]) .error p,
  :global([data-theme="dark"]) .loading-overlay p,
  :global([data-theme="dark"]) .error-overlay p {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .spinner {
    border-color: #475569;
    border-top-color: #3b82f6;
  }
</style>
