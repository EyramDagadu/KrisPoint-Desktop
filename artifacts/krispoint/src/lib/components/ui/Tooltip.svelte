<!-- Tooltip.svelte - Reusable tooltip component with smart positioning -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { settingsService } from '$lib/services/SettingsService.js';

  export let text = '';
  export let position = 'top'; // 'top', 'bottom', 'left', 'right'
  export let delay = 300; // ms delay before showing
  export let shortcut = ''; // Optional keyboard shortcut to display

  let showTooltip = false;
  let tooltipsEnabled = true;
  let timeoutId = null;
  let targetElement;
  let tooltipElement;
  let actualPosition = position; // The actual position after boundary detection

  onMount(() => {
    if (browser) {
      // Check if tooltips are enabled in settings
      const settings = settingsService.getAllSettings();
      tooltipsEnabled = settings?.interface?.tooltips !== false;

      // Listen for settings changes
      window.addEventListener('settingsChanged', handleSettingsChange);
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('settingsChanged', handleSettingsChange);
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  function handleSettingsChange() {
    const settings = settingsService.getAllSettings();
    tooltipsEnabled = settings?.interface?.tooltips !== false;
    if (!tooltipsEnabled) {
      showTooltip = false;
    }
  }

  function calculateBestPosition() {
    if (!targetElement || !tooltipElement || !browser) return position;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Calculate available space in each direction
    const spaces = {
      top: targetRect.top,
      bottom: viewport.height - targetRect.bottom,
      left: targetRect.left,
      right: viewport.width - targetRect.right
    };

    // Check if preferred position fits
    let bestPosition = position;

    if (position === 'top' && spaces.top < tooltipRect.height + 16) {
      // Not enough space on top, try bottom
      bestPosition = spaces.bottom > tooltipRect.height + 16 ? 'bottom' : 'bottom';
    } else if (position === 'bottom' && spaces.bottom < tooltipRect.height + 16) {
      // Not enough space on bottom, try top
      bestPosition = spaces.top > tooltipRect.height + 16 ? 'top' : 'top';
    } else if (position === 'left' && spaces.left < tooltipRect.width + 16) {
      // Not enough space on left, try right
      bestPosition = spaces.right > tooltipRect.width + 16 ? 'right' : 'right';
    } else if (position === 'right' && spaces.right < tooltipRect.width + 16) {
      // Not enough space on right, try left
      bestPosition = spaces.left > tooltipRect.width + 16 ? 'left' : 'left';
    }

    return bestPosition;
  }

  function handleMouseEnter() {
    if (!tooltipsEnabled) return;
    
    timeoutId = setTimeout(() => {
      showTooltip = true;
      // Wait for tooltip to render, then check boundaries
      setTimeout(() => {
        actualPosition = calculateBestPosition();
      }, 0);
    }, delay);
  }

  function handleMouseLeave() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    showTooltip = false;
    actualPosition = position; // Reset to default
  }
</script>

<div 
  class="tooltip-container"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  bind:this={targetElement}
>
  <slot />
  
  {#if showTooltip && tooltipsEnabled && text}
    <div 
      class="tooltip tooltip-{actualPosition}" 
      role="tooltip"
      bind:this={tooltipElement}
    >
      <div class="tooltip-content">
        {text}
        {#if shortcut}
          <span class="tooltip-shortcut">{shortcut}</span>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .tooltip-container {
    position: relative;
    display: inline-block;
  }

  .tooltip {
    position: absolute;
    z-index: 10000;
    background: #1f2937;
    color: #ffffff;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    line-height: 1.4;
    white-space: normal;
    max-width: 280px;
    word-wrap: break-word;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: tooltipFadeIn var(--animation-duration, 200ms) ease-out;
  }

  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .tooltip::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
  }

  /* Top position */
  .tooltip-top {
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip-top::before {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px 6px 0 6px;
    border-color: #1f2937 transparent transparent transparent;
  }

  /* Bottom position */
  .tooltip-bottom {
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip-bottom::before {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 6px 6px 6px;
    border-color: transparent transparent #1f2937 transparent;
  }

  /* Left position */
  .tooltip-left {
    right: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
  }

  .tooltip-left::before {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-width: 6px 0 6px 6px;
    border-color: transparent transparent transparent #1f2937;
  }

  /* Right position */
  .tooltip-right {
    left: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
  }

  .tooltip-right::before {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-width: 6px 6px 6px 0;
    border-color: transparent #1f2937 transparent transparent;
  }

  .tooltip-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tooltip-shortcut {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-family: 'Courier New', monospace;
    font-weight: 500;
    white-space: nowrap;
  }

  /* Theme support - Keep tooltips dark with white text for readability in all themes */
  :global(.light-theme) .tooltip {
    background: #374151;
    color: #ffffff;
  }

  :global(.light-theme) .tooltip-top::before {
    border-color: #374151 transparent transparent transparent;
  }

  :global(.light-theme) .tooltip-bottom::before {
    border-color: transparent transparent #374151 transparent;
  }

  :global(.light-theme) .tooltip-left::before {
    border-color: transparent transparent transparent #374151;
  }

  :global(.light-theme) .tooltip-right::before {
    border-color: transparent #374151 transparent transparent;
  }
</style>
