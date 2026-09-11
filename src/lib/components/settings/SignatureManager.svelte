<!-- src/lib/components/settings/SignatureManager.svelte -->
<script>
  import { onMount } from 'svelte';
  import { toastSuccess, toastError } from '$lib/utils/toast.js';
  import { authState } from '$lib/stores/authStore.js';

  let fileInput;
  let originalImage = null;
  let processedImage = null;
  let originalCanvas;
  let processedCanvas;
  let threshold = 200; // 0-255, higher = more aggressive background removal
  let savedSignature = null;
  let showPreview = false;
  let isLoading = false;

  onMount(() => {
    // Load saved signature from database
    loadSavedSignature();
  });

  async function loadSavedSignature() {
    try {
      isLoading = true;
      
      const response = await fetch('/api/users/signature', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.signature) {
          savedSignature = data.signature.url;
        }
      }
    } catch (error) {
      console.error('Error loading signature:', error);
    } finally {
      isLoading = false;
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastError('Image too large. Please use an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        showPreview = true; // Show preview FIRST so canvases mount
        // Process image after DOM updates (canvases exist)
        setTimeout(() => processImage(), 10);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function processImage() {
    if (!originalImage) {
      console.error('processImage called but no originalImage');
      return;
    }

    // Defensive check - ensure canvases are mounted
    if (!originalCanvas || !processedCanvas) {
      console.error('Canvases not mounted yet, retrying...');
      setTimeout(() => processImage(), 50);
      return;
    }

    // Set up canvases
    const origCtx = originalCanvas.getContext('2d');
    const procCtx = processedCanvas.getContext('2d');
    
    if (!origCtx || !procCtx) {
      console.error('Failed to get canvas contexts');
      toastError('Error processing signature. Please try again.');
      return;
    }

    // Set canvas dimensions to match image
    const maxWidth = 800;
    const maxHeight = 400;
    let width = originalImage.width;
    let height = originalImage.height;

    // Scale down if too large
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }

    originalCanvas.width = width;
    originalCanvas.height = height;
    processedCanvas.width = width;
    processedCanvas.height = height;

    // Draw original image
    origCtx.drawImage(originalImage, 0, 0, width, height);

    // Get image data for processing
    const imageData = origCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Process pixels - remove background
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate brightness (grayscale)
      const brightness = (r + g + b) / 3;
      
      // If pixel is bright (close to white), make it transparent
      if (brightness > threshold) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      } else {
        // For darker pixels (the signature), keep them but enhance contrast
        // Make blacks blacker for crisp signature
        const darkness = 1 - (brightness / 255);
        const enhancedDarkness = Math.pow(darkness, 1.5); // Enhance contrast
        const newBrightness = (1 - enhancedDarkness) * 255;
        
        data[i] = newBrightness;
        data[i + 1] = newBrightness;
        data[i + 2] = newBrightness;
        data[i + 3] = 255; // Keep fully opaque
      }
    }

    // Draw processed image
    procCtx.putImageData(imageData, 0, 0);

    // Convert to data URL for storage - use PNG for transparency support
    // but resize to reduce data size if needed
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Scale down further for storage (max 400x200 for signature)
    const storageMaxWidth = 400;
    const storageMaxHeight = 200;
    let storageWidth = width;
    let storageHeight = height;
    
    if (storageWidth > storageMaxWidth || storageHeight > storageMaxHeight) {
      const ratio = Math.min(storageMaxWidth / storageWidth, storageMaxHeight / storageHeight);
      storageWidth = Math.round(storageWidth * ratio);
      storageHeight = Math.round(storageHeight * ratio);
    }
    
    tempCanvas.width = storageWidth;
    tempCanvas.height = storageHeight;
    tempCtx.drawImage(processedCanvas, 0, 0, storageWidth, storageHeight);
    
    processedImage = tempCanvas.toDataURL('image/png', 0.8);
  }

  function handleThresholdChange() {
    // Reprocess image with new threshold
    if (originalImage) {
      processImage();
    }
  }

  async function saveSignature() {
    if (!processedImage) {
      toastError('Please upload and process a signature first');
      return;
    }
    
    let response;
    try {
      response = await fetch('/api/users/signature', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signatureUrl: processedImage,
          signatureName: 'Digital Signature'
        })
      });
    } catch (error) {
      console.error('Network error saving signature:', error);
      toastError('Network error - please check your connection');
      return;
    }
    
    // Always consume the response body
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Failed to parse response:', e);
      toastError('Server error - please try again');
      return;
    }
    
    console.log('Save signature response:', { ok: response.ok, data });
    
    if (!response.ok || !data.success) {
      toastError(data.error || 'Failed to save signature');
      return;
    }
    
    // Success - update state synchronously
    console.log('Signature saved, closing modal...');
    const imageToSave = processedImage;
    showPreview = false;
    originalImage = null;
    processedImage = null;
    savedSignature = imageToSave;
    authState.update(state => ({
      ...state,
      currentUser: state.currentUser ? { ...state.currentUser, signatureUrl: imageToSave } : state.currentUser
    }));
    if (fileInput) {
      fileInput.value = '';
    }
    toastSuccess('Signature saved successfully!');
  }

  async function removeSignature() {
    let response;
    try {
      response = await fetch('/api/users/signature', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Network error removing signature:', error);
      toastError('Network error - please check your connection');
      return;
    }
    
    // Always consume the response body
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      toastError(data.error || 'Failed to remove signature');
      return;
    }
    
    // Success
    savedSignature = null;
    authState.update(state => ({
      ...state,
      currentUser: state.currentUser ? { ...state.currentUser, signatureUrl: null } : state.currentUser
    }));
    toastSuccess('Signature removed');
  }

  function cancelUpload() {
    showPreview = false;
    originalImage = null;
    processedImage = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function uploadSignature() {
    fileInput?.click();
  }
</script>

<div class="signature-manager">
  <div class="section-header">
    <h3>Digital Signature</h3>
    <p class="section-description">
      Upload your handwritten signature. The background will be automatically removed for professional PDF reports.
    </p>
  </div>

  {#if savedSignature}
    <div class="saved-signature">
      <h4>Current Signature:</h4>
      <div class="signature-preview">
        <img src={savedSignature} alt="Saved signature" />
      </div>
      <div class="signature-actions">
        <button class="btn btn-secondary" on:click={uploadSignature}>
          Update Signature
        </button>
        <button class="btn btn-danger" on:click={removeSignature}>
          Remove Signature
        </button>
      </div>
    </div>
  {:else}
    <div class="no-signature">
      <div class="upload-prompt">
        <div class="upload-icon">✍️</div>
        <p>No signature uploaded yet</p>
        <button class="btn btn-primary" on:click={uploadSignature}>
          Upload Signature
        </button>
      </div>
    </div>
  {/if}

  {#if showPreview}
    <div class="preview-modal">
      <div class="modal-content">
        <h3>Signature Background Removal</h3>
        
        <div class="preview-grid">
          <div class="preview-section">
            <h4>Original Image</h4>
            <div class="canvas-container">
              <canvas bind:this={originalCanvas}></canvas>
            </div>
          </div>
          
          <div class="preview-section">
            <h4>Processed Signature</h4>
            <div class="canvas-container processed">
              <canvas bind:this={processedCanvas}></canvas>
            </div>
            <p class="preview-hint">✨ Background removed - transparent areas shown as checkerboard</p>
          </div>
        </div>

        <div class="threshold-control">
          <label for="threshold">
            Background Removal Strength: {threshold}
            <span class="threshold-hint">(Higher = more aggressive)</span>
          </label>
          <input 
            id="threshold"
            type="range" 
            min="150" 
            max="240" 
            bind:value={threshold}
            on:input={handleThresholdChange}
            class="threshold-slider"
          />
          <div class="threshold-labels">
            <span>Less</span>
            <span>More</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" on:click={cancelUpload}>
            Cancel
          </button>
          <button class="btn btn-primary" on:click={saveSignature}>
            Save Signature
          </button>
        </div>
      </div>
    </div>
  {/if}

  <input 
    type="file" 
    bind:this={fileInput}
    on:change={handleFileSelect}
    accept="image/*"
    style="display: none;"
  />
</div>

<style>
  .signature-manager {
    padding: 1.5rem;
    background: var(--color-surface, #ffffff);
    border-radius: 0.5rem;
    border: 1px solid var(--color-border, #e5e7eb);
  }

  .section-header h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 1.125rem;
    font-weight: 600;
  }

  .section-description {
    margin: 0;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .saved-signature {
    margin-top: 1.5rem;
  }

  .saved-signature h4 {
    margin: 0 0 1rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .signature-preview {
    padding: 2rem;
    background: 
      repeating-conic-gradient(#f9fafb 0% 25%, white 0% 50%) 
      50% / 20px 20px;
    border: 2px dashed var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 150px;
  }

  .signature-preview img {
    max-width: 100%;
    max-height: 200px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .signature-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.75rem;
  }

  .no-signature {
    margin-top: 1.5rem;
  }

  .upload-prompt {
    padding: 3rem 2rem;
    text-align: center;
    border: 2px dashed var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    background: var(--color-background, #f9fafb);
  }

  .upload-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .upload-prompt p {
    margin: 0 0 1.5rem 0;
    color: var(--color-text-muted, #6b7280);
  }

  .preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 2rem;
  }

  .modal-content {
    background: var(--color-surface, #ffffff);
    border-radius: 0.75rem;
    padding: 2rem;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-content h3 {
    margin: 0 0 1.5rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .preview-section h4 {
    margin: 0 0 0.75rem 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .canvas-container {
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    padding: 1rem;
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .canvas-container.processed {
    background: 
      repeating-conic-gradient(#f9fafb 0% 25%, white 0% 50%) 
      50% / 20px 20px;
  }

  .canvas-container canvas {
    max-width: 100%;
    height: auto;
  }

  .preview-hint {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    font-style: italic;
  }

  .threshold-control {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--color-background, #f9fafb);
    border-radius: 0.5rem;
  }

  .threshold-control label {
    display: block;
    margin-bottom: 0.75rem;
    color: var(--color-text-primary, #1f2937);
    font-size: 0.875rem;
    font-weight: 600;
  }

  .threshold-hint {
    color: var(--color-text-muted, #6b7280);
    font-weight: 400;
    font-size: 0.8rem;
  }

  .threshold-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--color-border, #e5e7eb);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .threshold-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .threshold-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .threshold-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1f2937);
    border: 1px solid var(--color-border, #d1d5db);
  }

  .btn-secondary:hover {
    background: var(--color-background, #f9fafb);
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background: #b91c1c;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .preview-grid {
      grid-template-columns: 1fr;
    }

    .modal-content {
      padding: 1.5rem;
    }
  }
</style>
