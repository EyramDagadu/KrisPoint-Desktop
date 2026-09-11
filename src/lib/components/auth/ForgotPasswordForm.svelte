<script>
    import { createEventDispatcher } from 'svelte';
    import { authActions } from '../../stores/authStore.js';
    import { toastSuccess, toastError } from '$lib/utils/toast.js';
    
    const dispatch = createEventDispatcher();
    
    let step = 1; // 1: Enter username, 2: Answer security question, 3: Set new password
    let username = '';
    let securityQuestion = '';
    let securityAnswer = '';
    let newPassword = '';
    let confirmPassword = '';
    let isSubmitting = false;
    let errorMessage = '';

    async function handleUsernameSubmit() {
        if (!username.trim()) {
            errorMessage = 'Please enter your username';
            return;
        }

        errorMessage = '';
        isSubmitting = true;

        try {
            // Normalize username - trim whitespace and store normalized version
            username = username.trim();
            
            const result = await authActions.getSecurityQuestion(username);
            
            if (result.success && result.question) {
                securityQuestion = result.question;
                step = 2;
            } else {
                errorMessage = result.error || 'Username not found or no security question set';
            }
        } catch (error) {
            errorMessage = 'An unexpected error occurred';
        } finally {
            isSubmitting = false;
        }
    }

    async function handleSecurityAnswerSubmit() {
        if (!securityAnswer.trim()) {
            errorMessage = 'Please answer the security question';
            return;
        }

        errorMessage = '';
        isSubmitting = true;

        try {
            const result = await authActions.verifySecurityAnswer(username, securityAnswer.trim());
            
            if (result.success) {
                step = 3;
            } else {
                errorMessage = result.error || 'Incorrect answer';
            }
        } catch (error) {
            errorMessage = 'An unexpected error occurred';
        } finally {
            isSubmitting = false;
        }
    }

    async function handlePasswordReset() {
        if (!newPassword || !confirmPassword) {
            errorMessage = 'Please fill in all password fields';
            return;
        }

        if (newPassword !== confirmPassword) {
            errorMessage = 'Passwords do not match';
            return;
        }

        if (newPassword.length < 6) {
            errorMessage = 'Password must be at least 6 characters long';
            return;
        }

        errorMessage = '';
        isSubmitting = true;

        try {
            const result = await authActions.resetPassword(username, newPassword);
            
            if (result.success) {
                toastSuccess('Password reset successfully! You can now login with your new password.');
                dispatch('passwordReset');
            } else {
                errorMessage = result.error || 'Failed to reset password';
            }
        } catch (error) {
            errorMessage = 'An unexpected error occurred';
        } finally {
            isSubmitting = false;
        }
    }

    function handleBack() {
        if (step === 2) {
            step = 1;
            securityAnswer = '';
            errorMessage = '';
        } else if (step === 3) {
            step = 2;
            newPassword = '';
            confirmPassword = '';
            errorMessage = '';
        }
    }

    function handleCancel() {
        dispatch('cancel');
    }
</script>

<div class="forgot-password-form">
    <div class="form-header">
        <img 
            src="/assets/branding/krispoint-logo-transparent.png" 
            alt="KrisPoint Logo" 
            class="login-logo"
        />
        <h2>Forgot Password</h2>
        <p>Recover your account using your security question</p>
    </div>

    {#if step === 1}
        <form on:submit|preventDefault={handleUsernameSubmit}>
            <div class="form-group">
                <label for="username">Username</label>
                <input 
                    type="text" 
                    id="username" 
                    bind:value={username}
                    placeholder="Enter your username"
                    disabled={isSubmitting}
                    autocomplete="username"
                    autofocus
                />
            </div>

            {#if errorMessage}
                <div class="error-message">
                    <span class="error-icon">⚠️</span>
                    {errorMessage}
                </div>
            {/if}

            <button 
                type="submit" 
                class="submit-btn"
                disabled={isSubmitting}
            >
                {#if isSubmitting}
                    <span class="loading-spinner"></span>
                    Checking...
                {:else}
                    Continue
                {/if}
            </button>

            <button 
                type="button" 
                class="back-btn"
                on:click={handleCancel}
            >
                Back to Login
            </button>
        </form>
    {:else if step === 2}
        <form on:submit|preventDefault={handleSecurityAnswerSubmit}>
            <div class="security-question-box">
                <label class="question-label">Security Question:</label>
                <p class="question-text">{securityQuestion}</p>
            </div>

            <div class="form-group">
                <label for="security-answer">Your Answer</label>
                <input 
                    type="text" 
                    id="security-answer" 
                    bind:value={securityAnswer}
                    placeholder="Enter your answer"
                    disabled={isSubmitting}
                    autofocus
                />
                <p class="hint-text">Answer is not case-sensitive</p>
            </div>

            {#if errorMessage}
                <div class="error-message">
                    <span class="error-icon">⚠️</span>
                    {errorMessage}
                </div>
            {/if}

            <button 
                type="submit" 
                class="submit-btn"
                disabled={isSubmitting}
            >
                {#if isSubmitting}
                    <span class="loading-spinner"></span>
                    Verifying...
                {:else}
                    Verify Answer
                {/if}
            </button>

            <button 
                type="button" 
                class="back-btn"
                on:click={handleBack}
            >
                Back
            </button>
        </form>
    {:else if step === 3}
        <form on:submit|preventDefault={handlePasswordReset}>
            <div class="success-message">
                <span class="success-icon">✅</span>
                Security question verified! Set your new password below.
            </div>

            <div class="form-group">
                <label for="new-password">New Password</label>
                <input 
                    type="password" 
                    id="new-password" 
                    bind:value={newPassword}
                    placeholder="Enter new password (min 6 characters)"
                    disabled={isSubmitting}
                    autocomplete="new-password"
                    autofocus
                />
            </div>

            <div class="form-group">
                <label for="confirm-password">Confirm Password</label>
                <input 
                    type="password" 
                    id="confirm-password" 
                    bind:value={confirmPassword}
                    placeholder="Re-enter new password"
                    disabled={isSubmitting}
                    autocomplete="new-password"
                />
            </div>

            {#if errorMessage}
                <div class="error-message">
                    <span class="error-icon">⚠️</span>
                    {errorMessage}
                </div>
            {/if}

            <button 
                type="submit" 
                class="submit-btn"
                disabled={isSubmitting}
            >
                {#if isSubmitting}
                    <span class="loading-spinner"></span>
                    Resetting Password...
                {:else}
                    Reset Password
                {/if}
            </button>

            <button 
                type="button" 
                class="back-btn"
                on:click={handleBack}
            >
                Back
            </button>
        </form>
    {/if}
</div>

<style>
    .forgot-password-form {
        max-width: 450px;
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
        width: 80px;
        height: auto;
        margin-bottom: 1rem;
    }

    .form-header h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary, #1f2937);
        margin-bottom: 0.5rem;
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
        font-weight: 500;
        color: var(--text-primary, #374151);
    }

    .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.2s;
        background: var(--background-primary, #ffffff);
        color: var(--text-primary, #1f2937);
        box-sizing: border-box;
    }

    .form-group input:focus {
        outline: none;
        border-color: var(--primary-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .security-question-box {
        background: var(--background-tertiary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .question-label {
        display: block;
        font-weight: 600;
        color: var(--text-secondary, #6b7280);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .question-text {
        font-size: 1rem;
        color: var(--text-primary, #1f2937);
        font-weight: 500;
        margin: 0;
    }

    .hint-text {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 0.25rem;
        font-style: italic;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        color: #991b1b;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .error-icon {
        flex-shrink: 0;
    }

    .success-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background-color: #f0fdf4;
        border: 1px solid #86efac;
        border-radius: 6px;
        color: #166534;
        font-size: 0.875rem;
        margin-bottom: 1.5rem;
    }

    .success-icon {
        flex-shrink: 0;
    }

    .submit-btn {
        width: 100%;
        padding: 0.875rem;
        background: var(--primary-color, #3b82f6);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .submit-btn:hover:not(:disabled) {
        background: var(--primary-color-dark, #2563eb);
    }

    .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .back-btn {
        width: 100%;
        padding: 0.75rem;
        background: transparent;
        color: var(--text-secondary, #6b7280);
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s;
    }

    .back-btn:hover:not(:disabled) {
        background: var(--background-tertiary, #f9fafb);
        border-color: var(--text-secondary, #6b7280);
    }

    .loading-spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
