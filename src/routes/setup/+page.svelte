<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let step: 'checking' | 'generate' | 'display' | 'complete' | 'already-configured' = 'checking';
  let generatedKey = '';
  let keyCopied = false;
  let confirmSaved = false;
  let error = '';
  let keyName = 'ENCRYPTION_KEY';

  onMount(async () => {
    const res = await fetch('/api/setup/status', { credentials: 'include' });
    const data = await res.json();
    keyName = data.keyName || 'ENCRYPTION_KEY';
    
    if (data.encryptionConfigured) {
      step = 'already-configured';
    } else {
      step = 'generate';
    }
  });

  async function generateKey() {
    error = '';
    try {
      const res = await fetch('/api/setup/generate-key', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        generatedKey = data.key;
        step = 'display';
      } else {
        error = data.error || 'Failed to generate key';
      }
    } catch (e) {
      error = 'Failed to connect to server';
    }
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(generatedKey);
      keyCopied = true;
    } catch (e) {
      error = 'Failed to copy to clipboard';
    }
  }

  async function completeSetup() {
    if (!confirmSaved) {
      error = 'Please confirm you have saved the key';
      return;
    }
    step = 'complete';
  }
</script>

<div class="setup-container">
  <div class="setup-card">
    <div class="logo">
      <h1>KrisPoint</h1>
      <span class="subtitle">Medical Reporting System</span>
    </div>

    {#if step === 'checking'}
      <div class="step">
        <div class="spinner"></div>
        <p>Checking system configuration...</p>
      </div>
    {:else if step === 'already-configured'}
      <div class="step">
        <div class="icon success">&#10003;</div>
        <h2>Already Configured</h2>
        <p>Encryption is already set up for this system.</p>
        <button class="btn primary" on:click={() => goto('/')}>Go to Login</button>
      </div>
    {:else if step === 'generate'}
      <div class="step">
        <div class="icon key">&#128273;</div>
        <h2>System Setup Required</h2>
        <p>This is the first time running KrisPoint on this server. We need to generate an encryption key to protect patient data.</p>
        
        <div class="warning-box">
          <strong>Important:</strong> The encryption key will be shown only once. You must save it securely. If lost, encrypted patient data cannot be recovered.
        </div>

        {#if error}
          <div class="error-box">{error}</div>
        {/if}

        <button class="btn primary" on:click={generateKey}>Generate Encryption Key</button>
      </div>
    {:else if step === 'display'}
      <div class="step">
        <div class="icon key">&#128273;</div>
        <h2>Save Your Encryption Key</h2>
        <p>Copy this key and store it in a secure location (password manager, printed in a safe, etc.)</p>
        
        <div class="key-display">
          <code>{generatedKey}</code>
          <button class="btn-copy" on:click={copyKey} title="Copy to clipboard">
            {keyCopied ? '&#10003; Copied' : 'Copy'}
          </button>
        </div>

        <div class="warning-box">
          <strong>This key will not be shown again!</strong> Make sure you have saved it before continuing.
        </div>

        {#if error}
          <div class="error-box">{error}</div>
        {/if}

        <label class="checkbox-label">
          <input type="checkbox" bind:checked={confirmSaved} />
          I have securely saved this encryption key
        </label>

        <button class="btn primary" on:click={completeSetup} disabled={!confirmSaved}>
          Complete Setup
        </button>
      </div>
    {:else if step === 'complete'}
      <div class="step">
        <div class="icon success">&#10003;</div>
        <h2>Almost Done!</h2>
        <p>Now set the encryption key as an environment variable on your server:</p>
        
        <div class="instructions">
          <div class="instruction-tab">
            <strong>Linux/macOS:</strong>
            <code>export {keyName}={generatedKey}</code>
            <p class="hint">Add to /etc/environment or ~/.bashrc for persistence</p>
          </div>
          
          <div class="instruction-tab">
            <strong>Windows:</strong>
            <code>setx {keyName} "{generatedKey}"</code>
            <p class="hint">Or set via System Properties → Environment Variables</p>
          </div>
          
          <div class="instruction-tab">
            <strong>Replit:</strong>
            <p>Add <code>{keyName}</code> to the Secrets tab</p>
          </div>
          
          <div class="instruction-tab">
            <strong>Docker:</strong>
            <code>-e {keyName}={generatedKey}</code>
          </div>
        </div>

        <div class="warning-box">
          After setting the environment variable, restart the server for changes to take effect.
        </div>

        <button class="btn primary" on:click={() => goto('/auth')}>Go to Login</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .setup-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 1rem;
  }

  .setup-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 2.5rem;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .logo {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo h1 {
    margin: 0;
    color: #1a1a2e;
    font-size: 2rem;
  }

  .logo .subtitle {
    color: #666;
    font-size: 0.9rem;
  }

  .step {
    text-align: center;
  }

  .step h2 {
    margin: 1rem 0 0.5rem;
    color: #1a1a2e;
  }

  .step p {
    color: #555;
    line-height: 1.6;
  }

  .icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .icon.success {
    color: #28a745;
  }

  .icon.key {
    color: #007bff;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .warning-box {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 1rem;
    margin: 1.5rem 0;
    text-align: left;
    color: #856404;
  }

  .error-box {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    color: #721c24;
  }

  .key-display {
    background: #f8f9fa;
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin: 1.5rem 0;
    position: relative;
  }

  .key-display code {
    display: block;
    word-break: break-all;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: #1a1a2e;
    padding-right: 60px;
  }

  .btn-copy {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .btn-copy:hover {
    background: #0056b3;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1.5rem 0;
    cursor: pointer;
    color: #333;
  }

  .checkbox-label input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn.primary {
    background: #007bff;
    color: white;
  }

  .btn.primary:hover:not(:disabled) {
    background: #0056b3;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .instructions {
    text-align: left;
    margin: 1.5rem 0;
  }

  .instruction-tab {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .instruction-tab strong {
    color: #1a1a2e;
    display: block;
    margin-bottom: 0.5rem;
  }

  .instruction-tab code {
    display: block;
    background: #e9ecef;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    word-break: break-all;
    margin: 0.5rem 0;
  }

  .instruction-tab .hint {
    font-size: 0.8rem;
    color: #666;
    margin: 0.25rem 0 0;
  }
</style>
