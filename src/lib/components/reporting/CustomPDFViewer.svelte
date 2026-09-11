<script>
  import { onDestroy } from 'svelte';
  import * as pdfjsLib from 'pdfjs-dist';
  
  export let pdfData = null;
  export let disableFitToWidth = false; // When true, always render at scale 1.0
  
  // DOM References
  let container;
  let canvasContainer;
  let canvas;
  let thumbnailsContainer;
  
  // PDF State
  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;
  
  // Rendering State
  let scale = 1.0;
  let fitToWidthScale = 1.0;
  let renderTask = null;
  let thumbnails = [];
  let pendingPage = null;
  let isRendering = false;
  let isLoading = false;
  let isInitialRenderComplete = false;
  let loadError = '';
  let loadedPdfData = null;
  
  // Set worker path IMMEDIATELY - before any reactive statements
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;
  
  // Load PDF whenever pdfData changes (handles both initial mount and updates)
  $: if (pdfData && pdfData !== loadedPdfData) {
    loadPDF();
  }
  
  async function loadPDF() {
    if (!pdfData) {
      console.error('loadPDF called but pdfData is null');
      return;
    }
    
    try {
      isLoading = true;
      isInitialRenderComplete = false;
      loadError = '';
      
      // Create a fresh copy to avoid ArrayBuffer detachment issues
      const pdfDataCopy = pdfData.slice(0);
      
      const loadingTask = pdfjsLib.getDocument({ data: pdfDataCopy });
      pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages;
      currentPage = 1;
      
      // Wait for canvas to be available in DOM
      await waitForCanvas();
      
      // Calculate fit-to-width scale based on container dimensions
      await calculateFitToWidthScale();
      
      // Render at calculated scale
      await renderPage(currentPage);
      await generateThumbnails();
      
      isLoading = false;
      isInitialRenderComplete = true;
      loadedPdfData = pdfData;
    } catch (error) {
      console.error('Error loading PDF:', error);
      loadError = error.message || 'Failed to load PDF';
      isLoading = false;
    }
  }
  
  async function waitForCanvas() {
    // Wait for canvas to be available in the DOM
    let attempts = 0;
    while (!canvas && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 10));
      attempts++;
    }
    
    if (!canvas) {
      throw new Error('Canvas element not available after waiting');
    }
  }
  
  async function calculateFitToWidthScale() {
    if (!pdfDoc || !canvasContainer) {
      return;
    }
    
    // If fit-to-width is disabled, always use scale 1.0
    if (disableFitToWidth) {
      scale = 1.0;
      fitToWidthScale = 1.0;
      return;
    }
    
    try {
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Get available width (accounting for padding)
      const containerWidth = canvasContainer.clientWidth;
      const availableWidth = containerWidth - 40; // 40px for padding
      
      // Calculate scale to fit width
      fitToWidthScale = availableWidth / viewport.width;
      
      // Clamp scale between 0.5 and 2.0 for reasonable bounds
      fitToWidthScale = Math.max(0.5, Math.min(2.0, fitToWidthScale));
      
      // Set initial scale to fit-to-width
      scale = fitToWidthScale;
    } catch (error) {
      console.error('Error calculating fit-to-width scale:', error);
      // Fallback to 1.0
      scale = 1.0;
      fitToWidthScale = 1.0;
    }
  }
  
  async function renderPage(pageNum) {
    if (!pdfDoc) return;
    
    // If already rendering, queue this page and return
    if (isRendering) {
      pendingPage = pageNum;
      return;
    }
    
    isRendering = true;
    
    try {
      // Cancel any existing render task
      if (renderTask) {
        renderTask.cancel();
        renderTask = null;
      }
      
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      if (!canvas) {
        console.error('Canvas not available for rendering');
        isRendering = false;
        return;
      }
      
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      renderTask = page.render(renderContext);
      await renderTask.promise;
      renderTask = null;
    } catch (error) {
      if (error.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
      renderTask = null;
    } finally {
      isRendering = false;
      
      // Process pending page if one was queued
      if (pendingPage !== null) {
        const nextPage = pendingPage;
        pendingPage = null;
        await renderPage(nextPage);
      }
    }
  }
  
  async function generateThumbnails() {
    thumbnails = [];
    
    for (let i = 1; i <= totalPages; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.height = viewport.height;
        thumbCanvas.width = viewport.width;
        
        const context = thumbCanvas.getContext('2d');
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        thumbnails = [...thumbnails, {
          pageNum: i,
          dataUrl: thumbCanvas.toDataURL()
        }];
      } catch (error) {
        console.error(`Error generating thumbnail for page ${i}:`, error);
      }
    }
  }
  
  function goToPage(pageNum) {
    if (pageNum >= 1 && pageNum <= totalPages) {
      currentPage = pageNum;
      renderPage(currentPage);
    }
  }
  
  function nextPage() {
    goToPage(currentPage + 1);
  }
  
  function prevPage() {
    goToPage(currentPage - 1);
  }
  
  function zoomIn() {
    scale = Math.min(scale + 0.2, 3.0);
    renderPage(currentPage);
  }
  
  function zoomOut() {
    scale = Math.max(scale - 0.2, 0.5);
    renderPage(currentPage);
  }
  
  function resetZoom() {
    scale = fitToWidthScale;
    renderPage(currentPage);
  }
  
  onDestroy(() => {
    if (renderTask) {
      renderTask.cancel();
    }
  });
</script>

<div class="pdf-viewer-container" bind:this={container}>
  <div class="thumbnails-sidebar" bind:this={thumbnailsContainer}>
    <div class="thumbnails-header">Pages</div>
    <div class="thumbnails-list">
      {#each thumbnails as thumb}
        <button
          class="thumbnail {currentPage === thumb.pageNum ? 'active' : ''}"
          on:click={() => goToPage(thumb.pageNum)}
        >
          <img src={thumb.dataUrl} alt="Page {thumb.pageNum}" />
          <span class="page-number">{thumb.pageNum}</span>
        </button>
      {/each}
    </div>
  </div>
  
  <div class="pdf-content">
    <div class="pdf-toolbar">
      <div class="toolbar-group">
        <button class="toolbar-btn" on:click={prevPage} disabled={currentPage <= 1}>
          ‹
        </button>
        <span class="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button class="toolbar-btn" on:click={nextPage} disabled={currentPage >= totalPages}>
          ›
        </button>
      </div>
      
      <div class="toolbar-group">
        <button class="toolbar-btn" on:click={zoomOut} title="Zoom Out">
          −
        </button>
        <button class="toolbar-btn" on:click={resetZoom} title="Reset Zoom">
          {Math.round(scale * 100)}%
        </button>
        <button class="toolbar-btn" on:click={zoomIn} title="Zoom In">
          +
        </button>
      </div>
    </div>
    
    <div class="canvas-container" bind:this={canvasContainer}>
      <!-- Always render canvas so it's available for rendering -->
      <canvas bind:this={canvas} style:display={isLoading || loadError ? 'none' : 'block'}></canvas>
      
      <!-- Overlay loading/error states -->
      {#if isLoading}
        <div class="loading-skeleton">
          <div class="skeleton-page">
            <div class="skeleton-shimmer"></div>
          </div>
          <p class="loading-text">Loading PDF...</p>
        </div>
      {:else if loadError}
        <div class="viewer-status error">
          <p>❌ {loadError}</p>
          <p class="error-detail">Check the browser console for details</p>
        </div>
      {:else if !pdfData}
        <div class="viewer-status">
          <p>No PDF data provided</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .pdf-viewer-container {
    display: flex;
    height: 100%;
    background: var(--color-background-secondary, #1e293b);
  }
  
  .thumbnails-sidebar {
    width: 150px;
    background: var(--color-surface, #0f172a);
    border-right: 1px solid var(--color-border, #334155);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .thumbnails-header {
    padding: 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-secondary, #94a3b8);
    border-bottom: 1px solid var(--color-border, #334155);
    background: var(--color-surface, #0f172a);
  }
  
  .thumbnails-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }
  
  .thumbnail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background: var(--color-background-secondary, #1e293b);
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .thumbnail:hover {
    background: var(--color-surface-hover, #334155);
    border-color: var(--color-primary, #3b82f6);
  }
  
  .thumbnail.active {
    background: var(--color-surface-hover, #334155);
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 1px var(--color-primary, #3b82f6);
  }
  
  .thumbnail img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .page-number {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #94a3b8);
    font-weight: 500;
  }
  
  .thumbnail.active .page-number {
    color: var(--color-primary, #3b82f6);
    font-weight: 600;
  }
  
  .pdf-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .pdf-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--color-surface, #0f172a);
    border-bottom: 1px solid var(--color-border, #334155);
  }
  
  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .toolbar-btn {
    padding: 0.5rem 0.75rem;
    background: var(--color-background-secondary, #1e293b);
    border: 1px solid var(--color-border, #334155);
    border-radius: 6px;
    color: var(--color-text-primary, #f1f5f9);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 40px;
  }
  
  .toolbar-btn:hover:not(:disabled) {
    background: var(--color-surface-hover, #334155);
    border-color: var(--color-primary, #3b82f6);
    color: var(--color-primary, #3b82f6);
  }
  
  .toolbar-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .page-info {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #94a3b8);
    font-weight: 500;
    padding: 0 0.5rem;
  }
  
  .canvas-container {
    flex: 1;
    overflow: auto;
    background: var(--color-background-secondary, #1e293b);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 2rem;
    position: relative; /* For absolute positioned overlays */
  }
  
  canvas {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    background: white;
    display: block;
  }
  
  .viewer-status {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--color-text-secondary, #94a3b8);
    background: var(--color-background-secondary, #1e293b);
    z-index: 10;
  }
  
  .viewer-status.error {
    color: var(--color-error, #ef4444);
  }
  
  .viewer-status p {
    margin: 0;
    font-size: 0.875rem;
  }
  
  .error-detail {
    font-size: 0.75rem;
    opacity: 0.7;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border, #334155);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .loading-skeleton {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    background: var(--color-background-secondary, #1e293b);
    z-index: 10;
  }
  
  .loading-skeleton .skeleton-page {
    width: 90%;
    max-width: 700px;
  }
  
  .skeleton-page {
    width: 100%;
    aspect-ratio: 8.5 / 11;
    background: white;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  
  .skeleton-shimmer {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(59, 130, 246, 0.1) 50%,
      transparent 100%
    );
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    to { left: 100%; }
  }
  
  .loading-text {
    color: var(--color-text-secondary, #94a3b8);
    font-size: 0.875rem;
    margin: 0;
  }
  
  /* Scrollbar styling */
  .thumbnails-list::-webkit-scrollbar,
  .canvas-container::-webkit-scrollbar {
    width: 8px;
  }
  
  .thumbnails-list::-webkit-scrollbar-track,
  .canvas-container::-webkit-scrollbar-track {
    background: var(--color-surface, #0f172a);
  }
  
  .thumbnails-list::-webkit-scrollbar-thumb,
  .canvas-container::-webkit-scrollbar-thumb {
    background: var(--color-border, #334155);
    border-radius: 4px;
  }
  
  .thumbnails-list::-webkit-scrollbar-thumb:hover,
  .canvas-container::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary, #3b82f6);
  }
</style>
