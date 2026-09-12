<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { isSoloEdition } from '$lib/config/edition';

  let show = true;
  let progress = 0;
  let statusText = 'Initializing...';

  const statusMessages = [
    'Initializing...',
    'Connecting to server...',
    'Loading system...',
    'Ready!'
  ];

  onMount(async () => {
    const interval = setInterval(() => {
      progress += 5;
      
      if (progress >= 25 && progress < 50) {
        statusText = statusMessages[1];
      } else if (progress >= 50 && progress < 75) {
        statusText = statusMessages[2];
      } else if (progress >= 75) {
        statusText = statusMessages[3];
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          show = false;
        }, 150);
      }
    }, 30);

    return () => clearInterval(interval);
  });
</script>

{#if show}
  <div class="splash-screen" transition:fade={{ duration: 200 }}>
    <div class="splash-content">
      <img 
        src="/splash.png" 
        alt="KrisPoint Logo" 
        class="logo"
      />
      
      <h1 class="app-name">KrisPoint</h1>
      <p class="tagline">{isSoloEdition ? 'Private Radiology Workstation' : 'Hospital Radiology System'}</p>
      
      <div class="loading-container">
        <div class="loading-bar">
          <div class="loading-progress" style="width: {progress}%"></div>
        </div>
        <p class="status-text">{statusText}</p>
      </div>
      
      <p class="version">v2.0.0</p>
    </div>
  </div>
{/if}

<style>
  .splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .splash-content {
    text-align: center;
    max-width: 500px;
    padding: 2rem;
  }

  .logo {
    width: 300px;
    height: 300px;
    object-fit: contain;
    margin: 0 auto 1.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.9;
      transform: scale(1.02);
    }
  }

  .app-name {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 0.5rem;
    letter-spacing: 0.5px;
  }

  .tagline {
    font-size: 1rem;
    color: #94a3b8;
    margin: 0 0 2.5rem;
  }

  .loading-container {
    margin: 0 0 1.5rem;
  }

  .loading-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .loading-progress {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    border-radius: 2px;
    transition: width 0.2s ease;
  }

  .status-text {
    font-size: 0.875rem;
    color: #94a3b8;
    margin: 0;
  }

  .version {
    font-size: 0.75rem;
    color: #94a3b8;
    opacity: 0.6;
    margin: 0;
  }
</style>
