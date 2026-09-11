<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authActions, isAuthenticated, permissions } from '../../lib/stores/authStore.js';
    import LoginForm from '../../lib/components/auth/LoginForm.svelte';
    import SetupForm from '../../lib/components/auth/SetupForm.svelte';
    import SetupWizard from '../../lib/components/auth/SetupWizard.svelte';
    import ForgotPasswordForm from '../../lib/components/auth/ForgotPasswordForm.svelte';
    
    let showSetup = false;
    let showForgotPassword = false;
    let showWizard = false;
    let isLoading = true;
    let isFirstUser = false;
    
    onMount(async () => {
        const hasUsers = await authActions.hasAnyDoctors();
        isFirstUser = !hasUsers;
        showSetup = isFirstUser;
        isLoading = false;
    });
    
    function getDefaultRoute(perms) {
        const canCreateReports = perms?.includes('reports.create');
        const canViewTemplates = perms?.includes('templates.read');
        return (!canCreateReports && !canViewTemplates) ? '/worklist' : '/';
    }
    
    $: if ($isAuthenticated && !showWizard) {
        goto(getDefaultRoute($permissions));
    }
    
    function handleLoginSuccess(event) {
        if (event.detail?.mustChangePassword) {
            goto('/settings?changePassword=required&tab=profile');
        } else {
            goto(getDefaultRoute($permissions));
        }
    }
    
    async function handleSetupComplete() {
        if (isFirstUser) {
            showSetup = false;
            showForgotPassword = false;
            showWizard = true;
        } else {
            window.location.reload();
        }
    }
    
    function handleWizardComplete() {
        showWizard = false;
        goto(getDefaultRoute($permissions));
    }
    
    function handlePasswordReset() {
        showForgotPassword = false;
    }
    
    function switchToLogin() {
        showSetup = false;
        showForgotPassword = false;
    }
    
    function switchToForgotPassword() {
        showForgotPassword = true;
        showSetup = false;
    }
</script>

<svelte:head>
    <title>KrisPoint - Authentication</title>
</svelte:head>

<div class="auth-page" class:wizard-mode={showWizard}>
    <div class="auth-container" class:wizard-container={showWizard}>
        {#if isLoading}
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Connecting to server...</p>
            </div>
        {:else if showWizard}
            <SetupWizard on:setupComplete={handleWizardComplete} />
        {:else if showSetup}
            <SetupForm 
                {isFirstUser}
                on:setupComplete={handleSetupComplete} 
            />
            
            {#if !isFirstUser}
                <div class="auth-switch">
                    <p>Already have an account?</p>
                    <button on:click={switchToLogin} class="switch-btn">
                        Sign In
                    </button>
                </div>
            {/if}
        {:else if showForgotPassword}
            <ForgotPasswordForm 
                on:passwordReset={handlePasswordReset}
                on:cancel={switchToLogin}
            />
        {:else}
            <LoginForm 
                on:loginSuccess={handleLoginSuccess} 
                on:forgotPassword={switchToForgotPassword}
            />
        {/if}
    </div>
</div>

<style>
    .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: 
            radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(30, 41, 59, 0.8) 0%, transparent 70%),
            linear-gradient(180deg, #0a0f1a 0%, #0f172a 50%, #1e293b 100%);
        background-attachment: fixed;
        padding: 2rem 1rem;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
    }
    
    :global(html:has(.auth-page)),
    :global(body:has(.auth-page)) {
        overflow-x: hidden;
        overflow-y: auto !important;
        height: auto;
        min-height: 100vh;
    }
    
    .auth-page::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.03) 0%, transparent 2%),
            radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.03) 0%, transparent 2%);
        background-size: 60px 60px;
        pointer-events: none;
        opacity: 0.5;
    }
    
    .auth-page::after {
        content: '';
        position: fixed;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: 
            conic-gradient(from 0deg at 50% 50%, 
                transparent 0deg, 
                rgba(59, 130, 246, 0.02) 60deg, 
                transparent 120deg,
                rgba(59, 130, 246, 0.02) 180deg,
                transparent 240deg,
                rgba(59, 130, 246, 0.02) 300deg,
                transparent 360deg
            );
        animation: subtle-rotate 120s linear infinite;
        pointer-events: none;
    }
    
    @keyframes subtle-rotate {
        to {
            transform: rotate(360deg);
        }
    }
    
    .auth-container {
        width: 100%;
        max-width: 600px;
        margin: auto 0;
        position: relative;
        z-index: 1;
    }
    
    .auth-container.wizard-container {
        max-width: 900px;
    }
    
    .loading-state {
        text-align: center;
        padding: 3rem;
        background: rgba(30, 41, 59, 0.95);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.1);
        backdrop-filter: blur(10px);
    }
    
    .loading-state p {
        margin-top: 1rem;
        color: #94a3b8;
    }
    
    .loading-spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid rgba(71, 85, 105, 0.3);
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    
    .auth-switch {
        text-align: center;
        margin-top: 1.5rem;
        padding: 1rem;
        background: rgba(30, 41, 59, 0.9);
        border-radius: 8px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(71, 85, 105, 0.3);
    }
    
    .auth-switch p {
        margin-bottom: 0.5rem;
        color: #94a3b8;
        font-size: 0.875rem;
    }
    
    .switch-btn {
        background: none;
        border: none;
        color: #3b82f6;
        font-weight: 500;
        text-decoration: underline;
        cursor: pointer;
        transition: color 0.2s;
    }
    
    .switch-btn:hover {
        color: #60a5fa;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
