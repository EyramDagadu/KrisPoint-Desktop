<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { authActions, authError, isLoading } from '../../stores/authStore.js';
    import { authService } from '../../services/AuthService.js';
    import { isSoloEdition } from '$lib/config/edition';
    
    const dispatch = createEventDispatcher();
    
    export let isFirstUser = false;
    
    let roles = [];
    let loadingRoles = true;
    
    let formData = {
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        specialty: 'Radiology',
        department: '',
        institution: '',
        title: 'Dr.',
        roleId: null,
        securityQuestion: '',
        securityAnswer: ''
    };
    
    const securityQuestions = [
        "What is your mother's maiden name?",
        "What was the name of your first pet?",
        "What city were you born in?",
        "What was your first car?",
        "What is your favorite food?",
        "What was the name of your elementary school?",
        "What is your favorite movie?",
        "What is your favorite book?"
    ];
    
    const titles = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.', 'Miss'];
    
    let formErrors = {};
    let isSubmitting = false;
    let registrationError = '';

    onMount(async () => {
        await loadRoles();
    });
    
    async function loadRoles() {
        try {
            const result = await authService.getRoles();
            if (result.success) {
                roles = result.roles || [];
                if (isFirstUser) {
                    const ownerRole = roles.find(r => r.name === 'owner');
                    if (ownerRole) {
                        formData.roleId = ownerRole.id;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        } finally {
            loadingRoles = false;
        }
    }

    function validateForm() {
        formErrors = {};
        
        if (!formData.username.trim()) {
            formErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            formErrors.username = 'Username must be at least 3 characters';
        }
        
        if (!formData.password) {
            formErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            formErrors.password = 'Password must be at least 8 characters';
        }
        
        if (formData.password !== formData.confirmPassword) {
            formErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (!formData.fullName.trim()) {
            formErrors.fullName = 'Full name is required';
        }
        
        if (isFirstUser && !formData.institution.trim()) {
            formErrors.institution = 'Facility/Institution is required';
        }
        
        if (!isFirstUser && !formData.roleId) {
            formErrors.roleId = 'Please select a role';
        }
        
        if (formData.securityQuestion && !formData.securityAnswer.trim()) {
            formErrors.securityAnswer = 'Security answer is required when question is selected';
        }
        
        return Object.keys(formErrors).length === 0;
    }

    async function handleSetup() {
        if (!validateForm()) {
            return;
        }

        isSubmitting = true;
        registrationError = '';

        try {
            const registrationData = {
                username: formData.username.trim(),
                password: formData.password,
                fullName: formData.fullName.trim(),
                email: formData.email.trim() || null,
                specialty: isFirstUser ? 'Administration' : formData.specialty,
                department: formData.department.trim() || null,
                institution: isFirstUser ? formData.institution.trim() : null,
                title: formData.title,
                roleId: formData.roleId
            };
            
            if (formData.securityQuestion && formData.securityAnswer) {
                registrationData.securityQuestion = formData.securityQuestion;
                registrationData.securityAnswer = formData.securityAnswer.trim();
            }
            
            const result = await authActions.register(registrationData);
            
            if (result.success) {
                // A Solo workspace has no second account or collaboration
                // step: establish the owner's session immediately.
                if (isSoloEdition && isFirstUser) {
                    const loginResult = await authActions.login(formData.username.trim(), formData.password);
                    if (!loginResult.success) {
                        registrationError = 'Owner created, but automatic sign-in failed. Please sign in.';
                        return;
                    }
                }
                dispatch('setupComplete', { user: result.user });
            } else {
                registrationError = result.error || 'Registration failed';
            }
        } catch (error) {
            console.error('Setup error:', error);
            registrationError = 'An unexpected error occurred';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="setup-form">
    <div class="form-header">
        {#if isFirstUser}
            <h2>Welcome to KrisPoint</h2>
            <p>{isSoloEdition ? 'Create the private workspace owner account' : 'Set up the System Owner account'}</p>
            <div class="first-user-notice">
                <span class="notice-icon">👑</span>
                <span>{isSoloEdition ? 'Only this owner can access the private workspace' : 'You will be the System Owner with full access to all features'}</span>
            </div>
        {:else}
            <h2>Create New User</h2>
            <p>Register a new staff member</p>
        {/if}
    </div>
    
    {#if loadingRoles}
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading...</p>
        </div>
    {:else}
        <form on:submit|preventDefault={handleSetup}>
            <div class="form-row">
                <div class="form-group">
                    <label for="title">Title</label>
                    <select 
                        id="title" 
                        bind:value={formData.title}
                        disabled={isSubmitting}
                    >
                        {#each titles as title}
                            <option value={title}>{title}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="form-group flex-grow">
                    <label for="fullName">Full Name *</label>
                    <input 
                        type="text" 
                        id="fullName" 
                        bind:value={formData.fullName}
                        placeholder="Full Name"
                        class:error={formErrors.fullName}
                        disabled={isSubmitting}
                    />
                    {#if formErrors.fullName}
                        <span class="field-error">{formErrors.fullName}</span>
                    {/if}
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="username">Username *</label>
                    <input 
                        type="text" 
                        id="username" 
                        bind:value={formData.username}
                        placeholder="Enter username"
                        class:error={formErrors.username}
                        disabled={isSubmitting}
                    />
                    {#if formErrors.username}
                        <span class="field-error">{formErrors.username}</span>
                    {/if}
                </div>

                <div class="form-group">
                    <label for="email">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        bind:value={formData.email}
                        placeholder="user@hospital.com"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="password">Password *</label>
                    <input 
                        type="password" 
                        id="password" 
                        bind:value={formData.password}
                        placeholder="Min. 8 characters"
                        class:error={formErrors.password}
                        disabled={isSubmitting}
                    />
                    {#if formErrors.password}
                        <span class="field-error">{formErrors.password}</span>
                    {/if}
                </div>

                <div class="form-group">
                    <label for="confirmPassword">Confirm Password *</label>
                    <input 
                        type="password" 
                        id="confirmPassword" 
                        bind:value={formData.confirmPassword}
                        placeholder="Confirm password"
                        class:error={formErrors.confirmPassword}
                        disabled={isSubmitting}
                    />
                    {#if formErrors.confirmPassword}
                        <span class="field-error">{formErrors.confirmPassword}</span>
                    {/if}
                </div>
            </div>

            {#if !isFirstUser}
                <div class="form-group">
                    <label for="role">Role *</label>
                    <select 
                        id="role" 
                        bind:value={formData.roleId}
                        class:error={formErrors.roleId}
                        disabled={isSubmitting}
                    >
                        <option value={null}>-- Select a role --</option>
                        {#each roles.filter(r => r.name !== 'owner') as role}
                            <option value={role.id}>{role.displayName}</option>
                        {/each}
                    </select>
                    {#if formErrors.roleId}
                        <span class="field-error">{formErrors.roleId}</span>
                    {/if}
                </div>
            {/if}

            {#if isFirstUser}
                <div class="form-group">
                    <label for="institution">Facility/Institution *</label>
                    <input 
                        type="text" 
                        id="institution" 
                        bind:value={formData.institution}
                        placeholder="e.g., Korle Bu Teaching Hospital"
                        class:error={formErrors.institution}
                        disabled={isSubmitting}
                    />
                    {#if formErrors.institution}
                        <span class="field-error">{formErrors.institution}</span>
                    {/if}
                    <p class="field-hint">This will be the default institution for all users</p>
                </div>
            {:else}
                <div class="form-row">
                    <div class="form-group">
                        <label for="specialty">Specialty</label>
                        <select 
                            id="specialty" 
                            bind:value={formData.specialty}
                            disabled={isSubmitting}
                        >
                            <option value="Radiology">Radiology</option>
                            <option value="Diagnostic Radiology">Diagnostic Radiology</option>
                            <option value="Interventional Radiology">Interventional Radiology</option>
                            <option value="Nuclear Medicine">Nuclear Medicine</option>
                            <option value="Radiation Oncology">Radiation Oncology</option>
                            <option value="General Medicine">General Medicine</option>
                            <option value="Administration">Administration</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="department">Department</label>
                        <input 
                            type="text" 
                            id="department" 
                            bind:value={formData.department}
                            placeholder="e.g., Radiology Dept"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
            {/if}

            <div class="security-section">
                <h3>Password Recovery (Optional)</h3>
                <p class="section-description">
                    Set up a security question to help recover the account if the password is forgotten.
                </p>
                
                <div class="form-group">
                    <label for="securityQuestion">Security Question</label>
                    <select 
                        id="securityQuestion" 
                        bind:value={formData.securityQuestion}
                        disabled={isSubmitting}
                    >
                        <option value="">-- Select a security question --</option>
                        {#each securityQuestions as question}
                            <option value={question}>{question}</option>
                        {/each}
                    </select>
                </div>
                
                {#if formData.securityQuestion}
                    <div class="form-group">
                        <label for="securityAnswer">Your Answer *</label>
                        <input 
                            type="text" 
                            id="securityAnswer" 
                            bind:value={formData.securityAnswer}
                            placeholder="Enter your answer"
                            class:error={formErrors.securityAnswer}
                            disabled={isSubmitting}
                        />
                        {#if formErrors.securityAnswer}
                            <span class="field-error">{formErrors.securityAnswer}</span>
                        {/if}
                    </div>
                {/if}
            </div>

            {#if registrationError || $authError}
                <div class="error-message">
                    <span class="error-icon">⚠️</span>
                    {registrationError || $authError}
                </div>
            {/if}

            <button 
                type="submit" 
                class="setup-btn"
                disabled={isSubmitting || $isLoading}
            >
                {#if isSubmitting || $isLoading}
                    <span class="loading-spinner"></span>
                    Creating account...
                {:else}
                    {isFirstUser
                        ? (isSoloEdition ? 'Create Solo Account' : 'Create System Owner Account')
                        : 'Create User Account'}
                {/if}
            </button>
        </form>
    {/if}
</div>

<style>
    .setup-form {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
        background: var(--background-secondary, #ffffff);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid var(--border-color, #e5e7eb);
        min-height: auto;
        width: 100%;
        box-sizing: border-box;
    }

    .form-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .form-header h2 {
        color: var(--text-primary, #1f2937);
        margin-bottom: 0.5rem;
        font-size: 1.75rem;
        font-weight: 600;
    }

    .form-header p {
        color: var(--text-secondary, #6b7280);
        font-size: 1rem;
    }
    
    .first-user-notice {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 1px solid #f59e0b;
        border-radius: 8px;
        color: #92400e;
        font-weight: 500;
        font-size: 0.875rem;
    }
    
    .notice-icon {
        font-size: 1.25rem;
    }
    
    .loading-state {
        text-align: center;
        padding: 3rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    
    .form-row .flex-grow {
        grid-column: span 1;
    }
    
    .form-row:has(.flex-grow) {
        grid-template-columns: auto 1fr;
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

    .form-group input,
    .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        background: var(--background-primary, #ffffff);
        color: var(--text-primary, #1f2937);
    }

    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: var(--primary-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input.error,
    .form-group select.error {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .form-group input:disabled,
    .form-group select:disabled {
        background-color: var(--background-tertiary, #f9fafb);
        color: var(--text-secondary, #6b7280);
        cursor: not-allowed;
    }

    .field-error {
        display: block;
        margin-top: 0.25rem;
        color: #dc2626;
        font-size: 0.75rem;
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

    .setup-btn {
        width: 100%;
        padding: 1rem;
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

    .setup-btn:hover:not(:disabled) {
        background-color: var(--primary-color-dark, #2563eb);
        transform: translateY(-1px);
    }

    .setup-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .setup-btn:disabled {
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

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .security-section {
        background: var(--background-tertiary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .security-section h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary, #1f2937);
        margin: 0 0 0.5rem 0;
    }

    .section-description {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        margin: 0 0 1rem 0;
        line-height: 1.5;
    }

    .field-hint {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 0.25rem;
        font-style: italic;
    }

    @media (max-width: 640px) {
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .form-row:has(.flex-grow) {
            grid-template-columns: 1fr;
        }
        
        .setup-form {
            padding: 1.5rem;
            margin: 0;
        }
    }
</style>
