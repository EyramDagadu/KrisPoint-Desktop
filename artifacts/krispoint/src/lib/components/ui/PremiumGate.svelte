<script>
  import { isLicenseActive, isLicenseExpired, licenseFeatures, licenseState, hasFeature } from '../../stores/licenseStore.js';
  import { goto } from '$app/navigation';
  
  export let feature = '';
  export let showUpgradePrompt = true;
  export let compact = false;
  
  $: isAllowed = !feature || hasFeature(feature);
  
  function goToLicense() {
    goto('/settings?tab=license');
  }

  function goToStore() {
    const serverUrl = $licenseState.serverUrl;
    if (serverUrl) {
      const key = $licenseState.license?.key || '';
      const url = key ? `${serverUrl}?license_key=${encodeURIComponent(key)}` : serverUrl;
      window.open(url, '_blank');
    } else {
      goto('/settings?tab=license');
    }
  }
  
  const featureNames = {
    voice: 'Voice Dictation',
    ai_polish: 'AI Report Polish',
    chat: 'Inter-User Chat',
    templates: 'Templates',
    macros: 'Macros'
  };
</script>

{#if $isLicenseActive && isAllowed}
  <slot />
{:else if showUpgradePrompt}
  <div class="premium-gate" class:compact>
    <div class="premium-icon">{$isLicenseExpired ? '⏰' : '🔒'}</div>
    <div class="premium-content">
      <h4>{featureNames[feature] || 'Premium Feature'}</h4>
      {#if $isLicenseExpired}
        <p>Your license has expired. Renew to continue using this feature.</p>
        <button class="upgrade-btn renew-btn" on:click={goToStore}>
          Renew License
        </button>
      {:else}
        <p>{$licenseState.error || 'This feature requires a premium license.'}</p>
        <button class="upgrade-btn" on:click={goToLicense}>
          {$licenseState.license ? 'Review License' : 'Upgrade Now'}
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .premium-gate {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border: 1px dashed rgba(102, 126, 234, 0.3);
    border-radius: 12px;
    text-align: center;
    gap: 1rem;
  }
  
  .premium-gate.compact {
    padding: 1rem;
    flex-direction: row;
    gap: 0.75rem;
  }
  
  .premium-icon {
    font-size: 2rem;
  }
  
  .compact .premium-icon {
    font-size: 1.5rem;
  }
  
  .premium-content h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text, #1f2937);
    font-size: 1.1rem;
  }
  
  .compact .premium-content h4 {
    margin: 0;
    font-size: 0.9rem;
  }
  
  .premium-content p {
    margin: 0 0 1rem 0;
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.9rem;
  }
  
  .compact .premium-content p {
    display: none;
  }
  
  .upgrade-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  
  .compact .upgrade-btn {
    padding: 0.35rem 1rem;
    font-size: 0.85rem;
  }
  
  .upgrade-btn:hover {
    opacity: 0.9;
  }

  .renew-btn {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }
</style>
