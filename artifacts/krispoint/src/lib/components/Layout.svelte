<!-- src/lib/components/Layout.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import Header from './ui/Header.svelte';
  import Sidebar from './ui/Sidebar.svelte';
  import ChatBubble from './ChatBubble.svelte';
  import IdleTimeoutWarning from './ui/IdleTimeoutWarning.svelte';
  import { authState, authActions } from '$lib/stores/authStore.js';
  import { idleTimeoutService } from '$lib/services/IdleTimeoutService';
  
  export let pageTitle = 'KrisPoint';
  export let showUserInfo = true;
  export let showNewReportButton = false;
  export let sidebarCollapsed = false;
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  $: isAuthenticated = $authState.isAuthenticated;
  $: currentUserId = $authState.user?.id || 0;
  
  $: if (browser && isAuthenticated) {
    idleTimeoutService.init(
      async () => {
        await authActions.logout();
      },
      { idleTimeoutMs: 15 * 60 * 1000, warningTimeMs: 2 * 60 * 1000 }
    );
  }
  
  onDestroy(() => {
    if (browser) {
      idleTimeoutService.stop();
    }
  });
  
  function handleNewReport() {
    dispatch('newReport');
  }
  
  function handleToggleSidebar() {
    dispatch('toggleSidebar');
  }
</script>

<div class="app-layout">
  <Sidebar 
    collapsed={sidebarCollapsed}
  />
  
  <div class="main-content">
    <Header 
      title={pageTitle}
      {showUserInfo}
      {showNewReportButton}
      {sidebarCollapsed}
      on:newReport={handleNewReport}
      on:toggleSidebar={handleToggleSidebar}
    />
    
    <main class="content-area">
      <slot />
    </main>
  </div>
</div>

{#if isAuthenticated}
  <ChatBubble {currentUserId} />
  <IdleTimeoutWarning />
{/if}

<style>
  .app-layout {
    display: flex;
    flex-direction: row;
    height: 100vh;
    width: 100%;
    background: var(--color-background);
    overflow: hidden;
  }
  
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; /* Prevents flex item from overflowing */
    overflow: hidden;
  }
  
  .content-area {
    flex: 1;
    overflow: auto;
    padding: 1.5rem;
    background: var(--color-background);
  }
  
  /* Special styling for reporting page - full height, no padding */
  :global(.content-area:has(.reporting-container)) {
    padding: 0;
    overflow: hidden;
  }
  
  /* Fallback for browsers that don't support :has() */
  :global(.reporting-page) .content-area {
    padding: 0;
    overflow: hidden;
  }
  
  @media (max-width: 768px) {
    .content-area {
      padding: 1rem;
    }
    
    :global(.content-area:has(.reporting-container)),
    :global(.reporting-page) .content-area {
      padding: 0;
    }
  }
</style>