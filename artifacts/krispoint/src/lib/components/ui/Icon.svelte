<script>
  export let name = 'file';
  export let size = 20;
  export let strokeWidth = 1.8;
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  {#if name === 'home'}<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>
  {:else if name === 'worklist'}<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5h6M9 10h6M9 14h6M9 18h4"/>
  {:else if name === 'edit'}<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4z"/>
  {:else if name === 'check'}<path d="m4 12 5 5L20 6"/>
  {:else if name === 'return'}<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>
  {:else if name === 'reports'}<path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M15 3v5h4M9 12h6M9 16h6"/>
  {:else if name === 'template'}<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>
  {:else if name === 'bolt'}<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>
  {:else if name === 'analytics'}<path d="M4 20V10m5 10V4m5 16v-7m5 7V7M2 20h20"/>
  {:else if name === 'users'}<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/>
  {:else if name === 'lock'}<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>
  {:else if name === 'mic'}<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0m-7 7v3m-4 0h8"/>
  {:else if name === 'settings'}<circle cx="12" cy="12" r="3"/><path d="M19 13.5a7 7 0 0 0 0-3l2-1.5-2-3.5-2.3 1a8 8 0 0 0-2.5-1.5L14 2h-4l-.2 3a8 8 0 0 0-2.5 1.5l-2.3-1L3 9l2 1.5a7 7 0 0 0 0 3L3 15l2 3.5 2.3-1a8 8 0 0 0 2.5 1.5L10 22h4l.2-3a8 8 0 0 0 2.5-1.5l2.3 1L21 15z"/>
  {:else if name === 'palette'}<path d="M12 3a9 9 0 1 0 9 9c0-1.1-.9-2-2-2h-1.2a2 2 0 0 1-1.8-2.9l.6-1.2A2 2 0 0 0 14.8 3H12Z"/><circle cx="7.5" cy="11.5" r=".7"/><circle cx="10" cy="7.5" r=".7"/><circle cx="7.5" cy="16" r=".7"/>
  {:else if name === 'logout'}<path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5m4-4 4-4-4-4m4 4H9"/>
  {:else if name === 'menu'}<path d="M4 6h16M4 12h16M4 18h16"/>
  {:else if name === 'plus'}<path d="M12 5v14M5 12h14"/>
  {:else if name === 'alert'}<path d="m12 3 10 18H2zM12 9v5m0 3h.01"/>
  {:else if name === 'arrow'}<path d="M4 12h16m-6-6 6 6-6 6"/>
  {:else}<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>
  {/if}
</svg>