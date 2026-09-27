<script>
  export let title = 'KrisPoint';
  export let showUserInfo = true;
  export let showNewReportButton = false;
  export let sidebarCollapsed = false;
  
  // Create event dispatcher
  import { createEventDispatcher } from 'svelte';
  import { currentUser } from '../../stores/authStore.js';
  import { isSoloEdition } from '$lib/config/edition';
  import Icon from './Icon.svelte';
  const dispatch = createEventDispatcher();
  
  function handleNewReport() {
    dispatch('newReport');
  }
  
  function handleToggleSidebar() {
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
      <button class="sidebar-toggle" on:click={handleToggleSidebar} title="Toggle sidebar" aria-label="Toggle sidebar" aria-expanded={!sidebarCollapsed}>
        <Icon name="menu" size={20} />
      </button>
      <h1>{title}</h1>
    </div>
    <div class="header-actions">
      {#if showNewReportButton}
        <button class="btn btn-primary" on:click={handleNewReport}>
          <Icon name="plus" size={17} />
          New Report
        </button>
      {/if}
      {#if showUserInfo}
        <div class="user-info">
          <div class="avatar">{getInitials($currentUser?.fullName)}</div>
          <div>
            <div class="user-name">{$currentUser?.fullName || 'Doctor'}</div>
            {#if !isSoloEdition || $currentUser?.designation}
              <div class="user-role">
                {isSoloEdition ? $currentUser?.designation : ($currentUser?.roleDisplayName || 'Radiologist')}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  .header {
    background: var(--color-surface);
    padding: .7rem 1.6rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 42px;
    gap: 1rem;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: .9rem;
    min-width: 0;
  }
  
  
  .sidebar-toggle {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
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
    font-size: 1.03rem;
    font-weight: 700;
    letter-spacing: -.015em;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }
  
  .btn {
    padding: .6rem .9rem;
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
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: .45rem;
    background: var(--color-primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    font-size: .75rem;
    font-weight: 700;
  }
  
  .user-name {
    font-weight: 700;
    font-size: .8rem;
  }
  
  .user-role {
    font-size: .72rem;
    color: var(--color-text-secondary);
  }
  @media (max-width: 640px) {
    .header { padding: .6rem .9rem; }
    .user-info > div:last-child { display: none; }
    .header h1 { font-size: .95rem; }
  }
</style>