<script>
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    let isSubmitting = false;
    let error = '';
    let facilityName = '';
    
    async function saveFacilityName() {
        if (!facilityName.trim()) {
            error = 'Please enter your facility name';
            return;
        }
        
        error = '';
        isSubmitting = true;
        
        try {
            const response = await fetch('/api/organization/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    key: 'facility_info',
                    value: { facilityName: facilityName.trim() }
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                error = data.error || 'Failed to save facility name';
                return;
            }
            
            dispatch('setupComplete');
        } catch (err) {
            console.error('Failed to save facility name:', err);
            error = 'Failed to save. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }
    
    function skipSetup() {
        dispatch('setupComplete');
    }
</script>

<div class="setup-wizard">
    <div class="wizard-card">
        <div class="welcome-icon">🏥</div>
        <h1>Welcome to KrisPoint Medical</h1>
        <p class="subtitle">Your radiology reporting system is almost ready</p>
        
        <div class="form-section">
            <label for="facilityName">What's your facility name?</label>
            <input 
                type="text" 
                id="facilityName" 
                bind:value={facilityName}
                placeholder="e.g., Korle Bu Teaching Hospital"
                class:has-error={error}
                disabled={isSubmitting}
            />
            {#if error}
                <span class="error-text">{error}</span>
            {/if}
            <p class="hint">This will appear on your reports. You can change it later in Settings.</p>
        </div>
        
        <div class="button-group">
            <button 
                class="btn-primary" 
                on:click={saveFacilityName}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Saving...' : 'Get Started'}
            </button>
            <button 
                class="btn-text" 
                on:click={skipSetup}
                disabled={isSubmitting}
            >
                Skip for now
            </button>
        </div>
    </div>
</div>

<style>
    .setup-wizard {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
    }
    
    .wizard-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        padding: 3rem;
        max-width: 480px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .welcome-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }
    
    h1 {
        color: var(--text-primary);
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
    }
    
    .subtitle {
        color: var(--text-secondary);
        margin: 0 0 2rem 0;
    }
    
    .form-section {
        text-align: left;
        margin-bottom: 2rem;
    }
    
    label {
        display: block;
        color: var(--text-primary);
        font-weight: 500;
        margin-bottom: 0.5rem;
    }
    
    input {
        width: 100%;
        padding: 0.875rem 1rem;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    input:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.15);
    }
    
    input::placeholder {
        color: var(--text-muted);
    }
    
    input.has-error {
        border-color: var(--status-error);
    }
    
    .error-text {
        display: block;
        color: var(--status-error);
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }
    
    .hint {
        color: var(--text-muted);
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }
    
    .button-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .btn-primary {
        padding: 0.875rem 1.5rem;
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s;
    }
    
    .btn-primary:hover:not(:disabled) {
        background: var(--accent-primary-hover);
        transform: translateY(-1px);
    }
    
    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .btn-text {
        padding: 0.5rem;
        background: transparent;
        color: var(--text-secondary);
        border: none;
        font-size: 0.875rem;
        cursor: pointer;
        transition: color 0.2s;
    }
    
    .btn-text:hover:not(:disabled) {
        color: var(--text-primary);
    }
    
    .btn-text:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
