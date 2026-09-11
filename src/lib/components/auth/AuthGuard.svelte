<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { authActions, isAuthenticated, isLoading } from '../../stores/authStore.js';
    import { editionCapabilities, isSoloEdition } from '$lib/config/edition';
    
    let hasInitialized = false;
    
    onMount(async () => {
        if (editionCapabilities.localVoiceLifecycle) {
            import('@tauri-apps/api/core')
                .then(({ invoke }) => invoke('start_voice_server'))
                .then((status) => {
                    if (status?.url) {
                        window.__KRISPOINT_VOICE_URL__ = status.url;
                    }
                })
                .catch((error) => console.info('Local voice server was not started:', error));
        }
        await authActions.initialize();
        hasInitialized = true;
        checkAuth();
    });
    
    function checkAuth() {
        if (!hasInitialized) return;
        
        const currentPath = $page?.url?.pathname || '/';
        const isAuthPage = currentPath === '/auth';
        
        if (!$isAuthenticated && !isAuthPage) {
            goto('/auth');
        } else if ($isAuthenticated && isAuthPage) {
            goto('/');
        }
    }
    
    $: if (hasInitialized) {
        checkAuth();
    }
    
    $: showLoading = $isLoading || !hasInitialized;
</script>

{#if showLoading}
    <div class="auth-loading">
        <div class="loading-container">
            <div class="logo-container">
                <div class="logo-text">KrisPoint</div>
                <div class="logo-subtitle">{isSoloEdition ? 'Private Radiology Workstation' : 'Hospital Radiology System'}</div>
            </div>
            
            <div class="loading-spinner"></div>
            <p class="status-ready">{isSoloEdition ? 'Opening your private workspace...' : 'Connecting to server...'}</p>
        </div>
    </div>
{:else}
    {#key $page.url.pathname}
        <slot />
    {/key}
{/if}

<style>
    .auth-loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1a1d29 0%, #2d3748 100%);
        z-index: 9999;
    }
    
    .loading-container {
        text-align: center;
        padding: 3rem 2.5rem;
        background: rgba(255, 255, 255, 0.98);
        border-radius: 16px;
        box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        min-width: 400px;
        max-width: 500px;
    }
    
    .logo-container {
        margin-bottom: 2rem;
    }
    
    .logo-text {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
    }
    
    .logo-subtitle {
        color: #6b7280;
        font-size: 0.95rem;
        font-weight: 500;
    }
    
    .loading-spinner {
        width: 3rem;
        height: 3rem;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 2rem;
    }
    
    .status-ready {
        margin-top: 1rem;
        color: #6b7280;
        font-weight: 500;
        font-size: 0.95rem;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
