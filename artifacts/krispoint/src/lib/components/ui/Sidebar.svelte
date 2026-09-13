<script>
  import { page } from '$app/stores';
  import { authActions, permissions } from '$lib/stores/authStore.js';
  import { reportBadgeCounts } from '$lib/stores/reportBadgeStore.js';
  import { editionCapabilities } from '$lib/config/edition';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import { onMount } from 'svelte';
  
  export let collapsed = false;
  
  let showLogoutConfirm = false;
  
  onMount(() => {
    if (!editionCapabilities.collaboration) {
      return;
    }
    reportBadgeCounts.loadCounts();
    const interval = setInterval(() => {
      reportBadgeCounts.loadCounts();
    }, 10000);
    return () => clearInterval(interval);
  });
  
  function handleLogout() {
    showLogoutConfirm = true;
  }

  async function confirmLogout() {
    await authActions.logout();
  }
  
  $: canManageUsers = $permissions?.includes('users.manage');
  $: canViewWorklist = $permissions?.includes('worklist.read');
  $: canReviewReports = $permissions?.includes('reports.review');
  $: canSubmitReports = $permissions?.includes('reports.submit');
  $: canViewAnalytics = $permissions?.includes('analytics.view');
  $: canCreateReports = $permissions?.includes('reports.create');
  $: canViewTemplates = $permissions?.includes('templates.read');
  
  $: pendingReviewsBadge = $reportBadgeCounts.pendingReviews;
  $: returnedReportsBadge = $reportBadgeCounts.returnedReports;
  
  $: menuItems = [
    { id: '', label: 'Home', icon: '🏠', badge: 0 },
    ...(canViewWorklist ? [{ id: 'worklist', label: 'Worklist', icon: '📋', badge: 0 }] : []),
    ...(canCreateReports ? [{ id: 'reporting', label: 'Continue Reporting', icon: '📝', badge: 0 }] : []),
    ...(canReviewReports && editionCapabilities.collaboration ? [{ id: 'reports/pending-reviews', label: 'Pending Reviews', icon: '✓', badge: pendingReviewsBadge }] : []),
    ...(canSubmitReports && editionCapabilities.collaboration ? [{ id: 'reports/returned', label: 'Returned Reports', icon: '↩️', badge: returnedReportsBadge }] : []),
    ...(canCreateReports ? [{ id: 'reports', label: 'All Reports', icon: '📚', badge: 0 }] : []),
    ...(canViewTemplates ? [{ id: 'templates', label: 'Templates', icon: '📄', badge: 0 }] : []),
    ...(canCreateReports ? [{ id: 'macros', label: 'Macros', icon: '⚡', badge: 0 }] : []),
    ...(canViewAnalytics ? [{ id: 'analytics', label: 'Analytics', icon: '📊', badge: 0 }] : []),
    ...(canManageUsers && editionCapabilities.multiUserAdministration ? [{ id: 'admin/users', label: 'Users', icon: '👥', badge: 0 }] : []),
    ...(canManageUsers ? [{ id: 'admin/audit-logs', label: 'Audit Logs', icon: '🔒', badge: 0 }] : []),
    ...(canManageUsers ? [{ id: 'admin/training-data', label: 'Training Data', icon: '🎙️', badge: 0 }] : []),
    { id: 'settings', label: 'Settings', icon: '⚙️', badge: 0 }
  ];
</script>

<div class="sidebar" class:collapsed={collapsed}>
  <div class="sidebar-header">
    <div class="logo">
      <img src="/assets/branding/krispoint-logo-transparent.png" alt="KrisPoint Logo" class="logo-image" />
      {#if !collapsed}
        <h1>KrisPoint</h1>
      {/if}
    </div>
  </div>
  
  <nav class="sidebar-nav">
    {#each menuItems as item}
      <a
        href="/{item.id}"
        class:active={$page.url.pathname === `/${item.id}`}
        class="nav-item"
        title={item.label}
      >
        <span class="icon-wrapper">
          <span class="icon">{item.icon}</span>
          {#if item.badge > 0 && collapsed}
            <span class="badge-dot"></span>
          {/if}
        </span>
        {#if !collapsed}
          <span class="label">{item.label}</span>
          {#if item.badge > 0}
            <span class="badge">{item.badge > 99 ? '99+' : item.badge}</span>
          {/if}
        {/if}
      </a>
    {/each}
  </nav>
  
  <div class="sidebar-footer">
    <button class="nav-item logout-btn" on:click={handleLogout} title="Logout">
      <span class="icon">🚪</span>
      {#if !collapsed}
        <span class="label">Logout</span>
      {/if}
    </button>
  </div>
</div>

<style>
  .sidebar {
    width: 250px;
    height: 100%;
    background: var(--color-surface);
    color: var(--color-text-primary);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    flex-shrink: 0;
  }
  
  .sidebar.collapsed {
    width: 60px;
  }
  
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.875rem;
  }

  .logo-image {
    width: 45px;
    height: 45px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .logo h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1;
  }
  
  .sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.625rem;
    border-radius: 0.375rem;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: background-color 0.2s;
    gap: 0.5rem;
    width: 100%;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    font-size: 0.875rem;
    font-family: inherit;
  }
  
  .nav-item:hover {
    background: var(--color-surface-hover);
  }
  
  .nav-item.active {
    background: var(--color-primary);
  }
  
  .logout-btn {
    color: var(--color-error, #ef4444);
  }
  
  .logout-btn:hover {
    background: var(--color-error-light, rgba(239, 68, 68, 0.1));
  }
  
  .icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .icon {
    font-size: 1rem;
    flex-shrink: 0;
  }
  
  .label {
    white-space: nowrap;
    flex: 1;
  }
  
  .badge {
    background: var(--color-primary, #3b82f6);
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 9999px;
    min-width: 1.25rem;
    text-align: center;
    line-height: 1;
    margin-left: auto;
    animation: badge-pop 0.2s ease-out;
  }
  
  .badge-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background: var(--color-primary, #3b82f6);
    border-radius: 50%;
    border: 2px solid var(--color-surface);
    animation: badge-pop 0.2s ease-out;
  }
  
  @keyframes badge-pop {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
  
  .sidebar-footer {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }
</style>

<ConfirmDialog
  bind:show={showLogoutConfirm}
  title="Logout?"
  message="Are you sure you want to logout?"
  confirmText="Logout"
  cancelText="Cancel"
  on:confirm={confirmLogout}
/>
