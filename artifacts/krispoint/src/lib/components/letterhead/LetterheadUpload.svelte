<script>
    import { createEventDispatcher } from 'svelte';
    import { letterheadStore, letterheadActions } from '../../stores/letterheadStore.js';
    
    const dispatch = createEventDispatcher();
    
    let fileInput;
    let dragOver = false;
    let fileName = '';
    let letterheadName = '';
    let preview = null;
    let selectedFile = null;
    
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']; // Only PNG/JPEG supported by pdf-lib
    
    function handleFileSelect(event) {
        const files = event.target.files || event.dataTransfer?.files;
        if (files?.length > 0) {
            processFile(files[0]);
        }
        dragOver = false;
    }
    
    function processFile(file) {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
            letterheadActions.setUploadState(false, 0, 'Please select a valid image file (JPG or PNG only)');
            return;
        }
        
        // Validate file size
        if (file.size > maxFileSize) {
            letterheadActions.setUploadState(false, 0, 'File size must be less than 5MB');
            return;
        }
        
        selectedFile = file;
        fileName = file.name;
        letterheadName = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            preview = e.target.result;
        };
        reader.readAsDataURL(file);
        
        letterheadActions.setUploadState(false, 0, null);
    }
    
    async function handleUpload() {
        if (!selectedFile || !letterheadName.trim()) {
            letterheadActions.setUploadState(false, 0, 'Please select a file and enter a name');
            return;
        }
        
        const file = selectedFile;
        letterheadActions.setUploadState(true, 0, null);
        
        try {
            // Simulate upload progress (in real implementation, this would be actual upload)
            for (let i = 0; i <= 100; i += 10) {
                letterheadActions.setUploadState(true, i, null);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // For now, we'll use a data URL as the "uploaded" URL
            // In a real implementation, this would upload to the object storage
            const reader = new FileReader();
            reader.onload = (e) => {
                const letterhead = {
                    id: Date.now().toString(),
                    name: letterheadName.trim(),
                    filename: fileName,
                    url: e.target.result, // In real implementation, this would be the storage URL
                    uploadDate: new Date(),
                    fileSize: file.size,
                    dimensions: { width: 0, height: 0 }, // Would be populated after image load
                    isDefault: false
                };
                
                // Get image dimensions
                const img = new Image();
                img.onload = () => {
                    letterhead.dimensions = { width: img.width, height: img.height };
                    letterheadActions.setUploadState(false, 0, null);
                    dispatch('success', letterhead);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Upload failed:', error);
            letterheadActions.setUploadState(false, 0, 'Upload failed. Please try again.');
        }
    }
    
    function handleCancel() {
        fileInput.value = '';
        selectedFile = null;
        fileName = '';
        letterheadName = '';
        preview = null;
        letterheadActions.setUploadState(false, 0, null);
        dispatch('cancel');
    }
    
    function handleDragOver(event) {
        event.preventDefault();
        dragOver = true;
    }
    
    function handleDragLeave() {
        dragOver = false;
    }
    
    function handleDrop(event) {
        event.preventDefault();
        handleFileSelect(event);
    }
</script>

<div class="letterhead-upload">
    <h4>📁 Upload New Letterhead</h4>
    
    <!-- File Upload Area -->
    <div 
        class="upload-area"
        class:drag-over={dragOver}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
        role="button"
        tabindex="0"
        on:click={() => fileInput.click()}
        on:keydown={(e) => e.key === 'Enter' && fileInput.click()}
    >
        {#if preview}
            <div class="preview-container">
                <img src={preview} alt="Preview" class="preview-image" />
                <div class="preview-info">
                    <p class="file-name">{fileName}</p>
                    <p class="file-size">{selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}</p>
                </div>
            </div>
        {:else}
            <div class="upload-prompt">
                <div class="upload-icon">📁</div>
                <p class="upload-text">Click to select or drag & drop your letterhead image</p>
                <p class="upload-hint">Supports JPG and PNG only (max 5MB)</p>
            </div>
        {/if}
    </div>
    
    <!-- Hidden file input -->
    <input
        bind:this={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        on:change={handleFileSelect}
        style="display: none;"
    />
    
    <!-- Name Input -->
    {#if fileName}
        <div class="name-input">
            <label for="letterhead-name">Letterhead Name:</label>
            <input
                id="letterhead-name"
                type="text"
                bind:value={letterheadName}
                placeholder="Enter a name for this letterhead"
                class="name-field"
            />
        </div>
    {/if}
    
    <!-- Error Display -->
    {#if $letterheadStore.uploadError}
        <div class="error-message">
            ⚠️ {$letterheadStore.uploadError}
        </div>
    {/if}
    
    <!-- Progress Bar -->
    {#if $letterheadStore.isUploading}
        <div class="progress-container">
            <div class="progress-bar">
                <div 
                    class="progress-fill"
                    style="width: {$letterheadStore.uploadProgress}%"
                ></div>
            </div>
            <span class="progress-text">{$letterheadStore.uploadProgress}%</span>
        </div>
    {/if}
    
    <!-- Actions -->
    <div class="upload-actions">
        <button 
            class="cancel-btn"
            on:click={handleCancel}
            disabled={$letterheadStore.isUploading}
        >
            Cancel
        </button>
        <button 
            class="upload-btn"
            on:click={handleUpload}
            disabled={!fileName || !letterheadName.trim() || $letterheadStore.isUploading}
        >
            {$letterheadStore.isUploading ? 'Uploading...' : 'Upload Letterhead'}
        </button>
    </div>
</div>

<style>
    .letterhead-upload {
        background: var(--background-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
    }
    
    .letterhead-upload h4 {
        color: var(--text-primary);
        margin-bottom: 20px;
        font-size: 1.1rem;
    }
    
    .upload-area {
        border: 2px dashed var(--border-color);
        border-radius: 8px;
        padding: 40px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 20px;
    }
    
    .upload-area:hover, .upload-area.drag-over {
        border-color: var(--color-primary);
        background: var(--background-tertiary);
    }
    
    .upload-prompt {
        color: var(--text-secondary);
    }
    
    .upload-icon {
        font-size: 3rem;
        margin-bottom: 10px;
    }
    
    .upload-text {
        font-size: 1rem;
        margin-bottom: 5px;
        color: var(--text-primary);
    }
    
    .upload-hint {
        font-size: 0.85rem;
        color: var(--text-secondary);
    }
    
    .preview-container {
        display: flex;
        align-items: center;
        gap: 20px;
        justify-content: center;
    }
    
    .preview-image {
        max-width: 300px;
        max-height: 200px;
        object-fit: contain;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: white;
        display: block;
    }
    
    .preview-info {
        text-align: left;
    }
    
    .file-name {
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 5px;
    }
    
    .file-size {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    
    .name-input {
        margin-bottom: 20px;
    }
    
    .name-input label {
        display: block;
        color: var(--text-primary);
        margin-bottom: 8px;
        font-weight: 500;
    }
    
    .name-field {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--background-primary);
        color: var(--text-primary);
        font-size: 1rem;
    }
    
    .name-field:focus {
        outline: none;
        border-color: var(--color-primary);
    }
    
    .error-message {
        background: var(--error-color);
        color: white;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 20px;
        font-size: 0.9rem;
    }
    
    .progress-container {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
    }
    
    .progress-bar {
        flex: 1;
        height: 8px;
        background: var(--background-tertiary);
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: var(--color-primary);
        transition: width 0.2s ease;
    }
    
    .progress-text {
        font-size: 0.9rem;
        color: var(--text-secondary);
        min-width: 40px;
    }
    
    .upload-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }
    
    .cancel-btn {
        background: var(--background-tertiary);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
    }
    
    .cancel-btn:hover:not(:disabled) {
        background: var(--background-secondary);
    }
    
    .upload-btn {
        background: var(--color-primary);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }
    
    .upload-btn:hover:not(:disabled) {
        background: var(--color-primary-hover);
    }
    
    .upload-btn:disabled, .cancel-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>