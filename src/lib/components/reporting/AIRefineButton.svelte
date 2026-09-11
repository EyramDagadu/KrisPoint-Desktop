<script>
  import { ollamaService } from '../../services/OllamaService.js';
  import { toastSuccess, toastError, toastInfo } from '../../utils/toast.js';
  import Tooltip from '$lib/components/ui/Tooltip.svelte';
  
  export let reportContent = '';
  export let indication = '';
  export let onReportGenerated = null;

  let isProcessing = false;
  let streamedContent = '';
  let showModal = false;

  async function handleAIRefine() {
    console.log('🎯 AI Refine button clicked');
    
    if (!reportContent.trim()) {
      toastError('Please add some content first');
      return;
    }

    console.log('📋 Report content length:', reportContent.length);

    // Check if Ollama is available
    console.log('🔍 Checking Ollama availability...');
    const available = await ollamaService.checkAvailability();
    console.log('✅ Ollama available:', available);
    
    if (!available) {
      toastError('Ollama is not running. Start Ollama and ensure mistral:7b model is loaded.');
      return;
    }

    isProcessing = true;
    streamedContent = '';
    showModal = true; // Show modal immediately for streaming
    console.log('✨ Modal opened, starting AI processing...');

    try {
      toastInfo('🤖 AI processing your report...');

      // Call smart refine with streaming callback
      console.log('🚀 Calling smartRefine...');
      const result = await ollamaService.smartRefine(
        reportContent,
        indication,
        'General', // templateType
        {}, // patientInfo
        (chunk) => {
          // Real-time streaming update - force Svelte reactivity
          console.log('📝 Streaming chunk received, length:', chunk.length);
          streamedContent = chunk;
        }
      );

      console.log('🎉 smartRefine completed, result length:', result?.length);

      if (result && result.trim()) {
        streamedContent = result;
        toastSuccess('✅ Report refined successfully!');
      } else {
        toastError('No output from AI. Please try again.');
      }
    } catch (error) {
      console.error('❌ AI Refine error:', error);
      toastError(`Error: ${error.message}`);
    } finally {
      isProcessing = false;
      console.log('🏁 AI processing finished');
    }
  }

  function closeModal() {
    showModal = false;
    streamedContent = '';
  }

  function acceptContent() {
    if (onReportGenerated) onReportGenerated(streamedContent);
    closeModal();
  }
</script>

<div class="ai-refine-button">
  <Tooltip text="Generate or polish report with AI" position="bottom">
    <button
      on:click={handleAIRefine}
      disabled={isProcessing || !reportContent.trim()}
      class:processing={isProcessing}
    >
      {#if isProcessing}
        <span class="spinner"></span>
      {:else}
        ✨
      {/if}
    </button>
  </Tooltip>
</div>

{#if showModal}
  <div class="ai-result-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>AI Generated Content</h3>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>
      <div class="modal-body">
        {#if isProcessing && !streamedContent}
          <div class="loading-state">
            <div class="spinner-large"></div>
            <h4>🤖 AI Processing Your Report</h4>
            <p>Analyzing content and generating professional medical report...</p>
            <p class="time-estimate">⏱️ This typically takes 20-30 seconds</p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
        {:else}
          <pre>{streamedContent || 'Waiting for response...'}</pre>
        {/if}
      </div>
      <div class="modal-footer">
        <button 
          class="btn-accept"
          on:click={acceptContent}
          disabled={isProcessing || !streamedContent}
        >
          Accept
        </button>
        <button 
          class="btn-cancel"
          on:click={closeModal}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .ai-refine-button {
    display: inline-block;
    margin: 0;
    padding: 0;
  }

  button {
    padding: 2px 4px;
    margin: 0;
    background: none;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    transition: all 0.2s ease;
    opacity: 0.7;
  }

  button:hover:not(:disabled) {
    opacity: 1;
    transform: scale(1.1);
  }

  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  button.processing {
    opacity: 1;
  }

  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .ai-result-modal {
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
    padding: 20px;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 800px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    color: #1e293b;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #64748b;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    color: #1e293b;
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    gap: 20px;
    min-height: 300px;
  }

  .loading-state h4 {
    margin: 0;
    color: #1e293b;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .loading-state p {
    color: #64748b;
    font-size: 0.95rem;
    margin: 0;
    text-align: center;
  }

  .time-estimate {
    color: #10b981;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .spinner-large {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(16, 185, 129, 0.2);
    border-top: 4px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .progress-bar {
    width: 100%;
    max-width: 400px;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 10px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 3px;
    animation: progress 30s ease-in-out forwards;
  }

  @keyframes progress {
    from {
      width: 0%;
    }
    to {
      width: 90%;
    }
  }

  pre {
    background: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #1e293b;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
  }

  .modal-footer {
    padding: 20px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .btn-accept {
    background: #10b981;
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    color: white;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-accept:hover {
    background: #059669;
    transform: translateY(-1px);
  }

  .btn-cancel {
    background: #ef4444;
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    color: white;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn-cancel:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }
</style>
