<script>
  export let title = 'KrisPoint';
  export let showUserInfo = true;
  export let showNewReportButton = false;
  export let sidebarCollapsed = false;
  
  // Create event dispatcher
  import { createEventDispatcher } from 'svelte';
  import { currentUser } from '../../stores/authStore.js';
  const dispatch = createEventDispatcher();
  
  function handleNewReport() {
    dispatch('newReport');
  }
  
  function handleToggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    dispatch('toggleSidebar');
  }
  
  // Generate initials from full name
  function getInitials(fullName) {
    if (!fullName) return 'DR';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }
</script>

<header class="header">
  <div class="header-content">
    <div class="header-left">
      <button class="sidebar-toggle" on:click={handleToggleSidebar} title="Toggle sidebar" aria-label="Toggle sidebar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
        </svg>
      </button>
      <h1>{title}</h1>
    </div>
    <div class="header-actions">
      {#if showNewReportButton}
        <button class="btn btn-primary" on:click={handleNewReport}>
          <span class="btn-icon">+</span>
          New Report
        </button>
      {/if}
      {#if showUserInfo}
        <div class="user-info">
          <div class="avatar">{getInitials($currentUser?.fullName)}</div>
          <div>
            <div class="user-name">{$currentUser?.fullName || 'Doctor'}</div>
            <div class="user-role">{$currentUser?.roleDisplayName || 'Radiologist'}</div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  .header {
    background: var(--color-background);
    padding: 0.75rem 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  
  .sidebar-toggle {
    padding: 0.5rem;
    border-radius: 0.375rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: background-color 0.2s;
  }
  
  .sidebar-toggle:hover {
    background: var(--color-surface-hover);
    color: var(--color-primary);
  }
  
  .header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
  }
  
  .btn-primary {
    background: var(--color-primary);
    color: var(--color-text-primary-inverse);
  }
  
  .btn-primary:hover {
    background: var(--color-primary-hover);
  }
  
  .btn-icon {
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary-inverse);
    font-weight: bold;
  }
  
  .user-name {
    font-weight: 500;
  }
  
  .user-role {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }
</style>