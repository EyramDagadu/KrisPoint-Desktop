<!-- Root Layout Component -->
<script>
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import AuthGuard from '$lib/components/auth/AuthGuard.svelte';
  import SplashScreen from '$lib/components/SplashScreen.svelte';
  import Header from '$lib/components/ui/Header.svelte';
  import Sidebar from '$lib/components/ui/Sidebar.svelte';
  import ChatBubble from '$lib/components/ChatBubble.svelte';
  import IdleTimeoutWarning from '$lib/components/ui/IdleTimeoutWarning.svelte';
  import BetaTermsGate from '$lib/components/legal/BetaTermsGate.svelte';
  import { authState, authActions } from '$lib/stores/authStore.js';
  import { idleTimeoutService } from '$lib/services/IdleTimeoutService';
  import { editionCapabilities } from '$lib/config/edition';
  
  let mounted = false;
  let sidebarCollapsed = true;
  
  $: isAuthenticated = $authState.isAuthenticated;
  $: currentUserId = $authState.currentUser?.id || 0;
  $: currentPath = $page?.url?.pathname || '/';
  $: isAuthPage = currentPath === '/auth';
  
  $: pageTitle = getPageTitle(currentPath);
  
  function getPageTitle(path) {
    const titles = {
      '/': 'KrisPoint Dashboard',
      '/analytics': 'Analytics',
      '/worklist': 'Worklist',
      '/reporting': 'Report Editor',
      '/reports': 'All Reports',
      '/reports/pending-reviews': 'Pending Reviews',
      '/reports/returned': 'Returned Reports',
      '/templates': 'Templates',
      '/macros': 'Macros',
      '/settings': 'Settings',
      '/admin/users': 'User Management',
      '/admin/audit-logs': 'Audit Logs',
      '/admin/training-data': 'Training Data',
      '/admin/analytics': 'Admin Analytics'
    };
    return titles[path] || 'KrisPoint';
  }
  
  $: if (browser && isAuthenticated) {
    idleTimeoutService.init(
      async () => {
        await authActions.logout();
      },
      { idleTimeoutMs: 15 * 60 * 1000, warningTimeMs: 2 * 60 * 1000 }
    );
  }
  
  onMount(async () => {
    mounted = true;
    
    if (browser) {
      try {
        const { themeService } = await import('$lib/services/ThemeService.js');
        if (themeService) {
          console.log('ThemeService initialized:', themeService.currentTheme);
        }
      } catch (error) {
        console.error('Failed to initialize ThemeService:', error);
      }
    }
  });
  
  onDestroy(() => {
    if (browser) {
      idleTimeoutService.stop();
    }
  });
  
  function handleToggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
  }
</script>

{#if mounted}
  <SplashScreen />
{/if}

<BetaTermsGate>
  <AuthGuard>
    {#if isAuthPage}
      <slot />
    {:else}
      <div class="app-layout">
        <Sidebar collapsed={sidebarCollapsed} />

        <div class="main-content">
          <Header
            title={pageTitle}
            showUserInfo={true}
            showNewReportButton={false}
            {sidebarCollapsed}
            on:toggleSidebar={handleToggleSidebar}
          />

          <main class="content-area">
            {#key $page.url.pathname}
              <slot />
            {/key}
          </main>
        </div>
      </div>

      {#if isAuthenticated}
        {#if editionCapabilities.collaboration}
          <ChatBubble {currentUserId} />
        {/if}
        <IdleTimeoutWarning />
      {/if}
    {/if}
  </AuthGuard>
</BetaTermsGate>

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
    min-width: 0;
    overflow: hidden;
  }
  
  .content-area {
    flex: 1;
    overflow: auto;
    padding: 1.5rem;
    background: var(--color-background);
  }
  
  :global(.content-area:has(.reporting-container)) {
    padding: 0;
    overflow: hidden;
  }
  
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

  :global(:root) {
    --color-primary: #3b82f6;
    --color-background: #ffffff;
    --color-text-primary: #1e293b;
    --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: var(--font-primary);
    background-color: var(--color-background);
    color: var(--color-text-primary);
    overflow: auto;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(.kp-toast) {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    min-width: 350px;
    max-width: 500px;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: slideInRight 0.3s ease-out;
    font-weight: 600;
    transition: opacity 0.3s ease-out;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  :global(.kp-toast-success) {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  :global(.kp-toast-error) {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }

  :global(.kp-toast-info) {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }

  :global(.kp-toast-warning) {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  :global(.kp-toast-content) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  :global(.kp-toast-message) {
    flex: 1;
    font-size: 1rem;
    line-height: 1.4;
  }

  :global(.kp-toast-close) {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 1.5rem;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s;
    line-height: 1;
    padding: 0;
  }

  :global(.kp-toast-close:hover) {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
