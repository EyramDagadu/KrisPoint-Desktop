<script>
    import { createEventDispatcher } from 'svelte';
    import { authActions, authError, isLoading } from '../../stores/authStore.js';
    
    const dispatch = createEventDispatcher();
    
    let username = '';
    let password = '';
    let showPassword = false;
    let formError = '';
    let isSubmitting = false;

    async function handleLogin() {
        if (!username.trim() || !password.trim()) {
            formError = 'Please enter both username and password';
            return;
        }

        formError = '';
        isSubmitting = true;

        try {
            const result = await authActions.login(username.trim(), password);
            
            if (result.success) {
                dispatch('loginSuccess', { mustChangePassword: result.mustChangePassword });
            } else {
                formError = result.error || 'Login failed';
            }
        } catch (error) {
            formError = 'An unexpected error occurred';
        } finally {
            isSubmitting = false;
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Enter') {
            handleLogin();
        }
    }
</script>

<div class="login-form">
    <div class="form-header">
        <img 
            src="/assets/branding/krispoint-logo-transparent.png" 
            alt="KrisPoint Logo" 
            class="login-logo"
        />
        <h2>KrisPoint Login</h2>
        <p>Sign in to access the radiology reporting system</p>
    </div>

    <form on:submit|preventDefault={handleLogin}>
        <div class="form-group">
            <label for="username">Username</label>
            <input 
                type="text" 
                id="username" 
                bind:value={username}
                on:keydown={handleKeydown}
                placeholder="Enter your username"
                disabled={isSubmitting}
                autocomplete="username"
            />
        </div>

        <div class="form-group">
            <label for="password">Password</label>
            <div class="password-field">
                <input 
                    type={showPassword ? 'text' : 'password'}
                    id="password" 
                    bind:value={password}
                    on:keydown={handleKeydown}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    autocomplete="current-password"
                />
                <button 
                    type="button" 
                    class="password-toggle"
                    on:click={() => showPassword = !showPassword}
                    disabled={isSubmitting}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? '👁️' : '🙈'}
                </button>
            </div>
        </div>

        {#if formError || $authError}
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                {formError || $authError}
            </div>
        {/if}

        <button 
            type="submit" 
            class="login-btn"
            disabled={isSubmitting || $isLoading}
        >
            {#if isSubmitting || $isLoading}
                <span class="loading-spinner"></span>
                Signing in...
            {:else}
                Sign In
            {/if}
        </button>
        
        <div class="forgot-password-link">
            <button 
                type="button" 
                class="link-btn"
                on:click={() => dispatch('forgotPassword')}
                disabled={isSubmitting}
            >
                Forgot Password?
            </button>
        </div>
    </form>
    
    <div class="help-section">
        <p class="help-text">Need an account? Contact your system administrator.</p>
    </div>
</div>

<style>
    .login-form {
        max-width: 400px;
        margin: 0 auto;
        padding: 2rem;
        background: var(--background-secondary, #ffffff);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid var(--border-color, #e5e7eb);
    }

    .form-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .login-logo {
        width: 120px;
        height: 120px;
        object-fit: contain;
        margin: 0 auto 1.5rem;
        display: block;
    }

    .form-header h2 {
        color: var(--text-primary, #1f2937);
        margin-bottom: 0.5rem;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .form-header p {
        color: var(--text-secondary, #6b7280);
        font-size: 0.875rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-primary, #374151);
        font-weight: 500;
        font-size: 0.875rem;
    }

    .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        background: var(--background-primary, #ffffff);
        color: var(--text-primary, #1f2937);
    }

    .form-group input:focus {
        outline: none;
        border-color: var(--primary-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input:disabled {
        background-color: var(--background-tertiary, #f9fafb);
        color: var(--text-secondary, #6b7280);
        cursor: not-allowed;
    }

    .password-field {
        position: relative;
        display: flex;
        align-items: center;
    }

    .password-field input {
        padding-right: 3rem;
    }

    .password-toggle {
        position: absolute;
        right: 0.75rem;
        background: none;
        border: none;
        font-size: 1rem;
        cursor: pointer;
        padding: 0;
        color: var(--text-secondary, #6b7280);
        transition: color 0.2s;
    }

    .password-toggle:hover:not(:disabled) {
        color: var(--text-primary, #374151);
    }

    .password-toggle:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        color: #dc2626;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .error-icon {
        flex-shrink: 0;
    }

    .login-btn {
        width: 100%;
        padding: 0.875rem;
        background-color: var(--primary-color, #3b82f6);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .login-btn:hover:not(:disabled) {
        background-color: var(--primary-color-dark, #2563eb);
        transform: translateY(-1px);
    }

    .login-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .login-btn:disabled {
        background-color: var(--text-secondary, #6b7280);
        cursor: not-allowed;
        transform: none;
    }

    .loading-spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .forgot-password-link {
        text-align: center;
        margin-top: 1rem;
    }

    .link-btn {
        background: none;
        border: none;
        color: var(--primary-color, #3b82f6);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: underline;
        transition: color 0.2s;
        padding: 0;
    }

    .link-btn:hover:not(:disabled) {
        color: var(--primary-color-dark, #2563eb);
    }

    .link-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .help-section {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color, #e5e7eb);
        text-align: center;
    }
    
    .help-text {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        margin: 0;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
