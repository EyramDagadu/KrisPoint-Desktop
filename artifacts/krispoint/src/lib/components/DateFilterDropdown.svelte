<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    export let startDate: string = '';
    export let endDate: string = '';
    export let selectedPreset: string = 'all';
    
    let showCustomPicker = false;
    let customMode: 'day' | 'range' = 'day';
    let customDay = '';
    let customStartDate = '';
    let customEndDate = '';
    
    const presets = [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: '3months', label: 'Past 3 Months' },
        { value: 'year', label: 'Past Year' },
        { value: 'custom-day', label: 'Custom Day' },
        { value: 'custom-range', label: 'Custom Range' }
    ];
    
    function getDateRange(preset: string): { start: string; end: string } {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        
        switch (preset) {
            case 'today':
                return { start: formatDate(today), end: formatDate(today) };
            case '7days': {
                const start = new Date(today);
                start.setDate(start.getDate() - 6);
                return { start: formatDate(start), end: formatDate(today) };
            }
            case '30days': {
                const start = new Date(today);
                start.setDate(start.getDate() - 29);
                return { start: formatDate(start), end: formatDate(today) };
            }
            case '3months': {
                const start = new Date(today);
                start.setMonth(start.getMonth() - 3);
                return { start: formatDate(start), end: formatDate(today) };
            }
            case 'year': {
                const start = new Date(today);
                start.setFullYear(start.getFullYear() - 1);
                return { start: formatDate(start), end: formatDate(today) };
            }
            case 'all':
            default:
                return { start: '', end: '' };
        }
    }
    
    function handlePresetChange(e: Event) {
        const value = (e.target as HTMLSelectElement).value;
        selectedPreset = value;
        
        if (value === 'custom-day') {
            customMode = 'day';
            showCustomPicker = true;
        } else if (value === 'custom-range') {
            customMode = 'range';
            showCustomPicker = true;
        } else {
            showCustomPicker = false;
            const range = getDateRange(value);
            startDate = range.start;
            endDate = range.end;
            dispatch('change', { startDate, endDate, preset: value });
        }
    }
    
    function applyCustomFilter() {
        if (customMode === 'day' && customDay) {
            startDate = customDay;
            endDate = customDay;
        } else if (customMode === 'range') {
            startDate = customStartDate;
            endDate = customEndDate;
        }
        dispatch('change', { startDate, endDate, preset: selectedPreset });
        showCustomPicker = false;
    }
    
    function cancelCustom() {
        showCustomPicker = false;
        selectedPreset = 'all';
        customDay = '';
        customStartDate = '';
        customEndDate = '';
    }
    
    function getDisplayLabel(): string {
        if (selectedPreset === 'custom-day' && startDate) {
            return formatDisplayDate(startDate);
        }
        if (selectedPreset === 'custom-range' && startDate && endDate) {
            return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
        }
        const preset = presets.find(p => p.value === selectedPreset);
        return preset?.label || 'All Time';
    }
    
    function formatDisplayDate(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    
    $: displayLabel = getDisplayLabel();
</script>

<div class="date-filter-dropdown">
    <select 
        class="preset-select"
        value={selectedPreset}
        on:change={handlePresetChange}
    >
        {#each presets as preset}
            <option value={preset.value}>{preset.label}</option>
        {/each}
    </select>
    
    {#if showCustomPicker}
        <div class="custom-picker-overlay" on:click={cancelCustom}></div>
        <div class="custom-picker">
            <div class="custom-picker-header">
                <h4>{customMode === 'day' ? 'Select Date' : 'Select Date Range'}</h4>
                <button class="close-btn" on:click={cancelCustom}>&times;</button>
            </div>
            <div class="custom-picker-body">
                {#if customMode === 'day'}
                    <div class="date-input-group">
                        <label for="customDay">Date</label>
                        <input 
                            type="date" 
                            id="customDay"
                            bind:value={customDay}
                        />
                    </div>
                {:else}
                    <div class="date-input-group">
                        <label for="customStart">From</label>
                        <input 
                            type="date" 
                            id="customStart"
                            bind:value={customStartDate}
                        />
                    </div>
                    <div class="date-input-group">
                        <label for="customEnd">To</label>
                        <input 
                            type="date" 
                            id="customEnd"
                            bind:value={customEndDate}
                        />
                    </div>
                {/if}
            </div>
            <div class="custom-picker-footer">
                <button class="btn-cancel" on:click={cancelCustom}>Cancel</button>
                <button class="btn-apply" on:click={applyCustomFilter}>Apply</button>
            </div>
        </div>
    {/if}
</div>

<style>
    .date-filter-dropdown {
        position: relative;
        display: inline-block;
    }
    
    .preset-select {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        font-size: 0.875rem;
        cursor: pointer;
        min-width: 150px;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        padding-right: 2rem;
    }
    
    .preset-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .preset-select option {
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
    }
    
    :global([data-theme="dark"]) .preset-select {
        background-color: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E");
    }
    
    :global([data-theme="dark"]) .preset-select option {
        background: #1e293b;
        color: #f1f5f9;
    }
    
    .custom-picker-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 999;
    }
    
    .custom-picker {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        background: var(--color-surface, #ffffff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 280px;
        animation: slideDown 0.15s ease-out;
    }
    
    :global([data-theme="dark"]) .custom-picker {
        background: #1e293b;
        border-color: #334155;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .custom-picker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
    }
    
    :global([data-theme="dark"]) .custom-picker-header {
        border-color: #334155;
    }
    
    .custom-picker-header h4 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--color-text-primary, #1f2937);
    }
    
    :global([data-theme="dark"]) .custom-picker-header h4 {
        color: #f1f5f9;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: var(--color-text-secondary, #6b7280);
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    .close-btn:hover {
        color: var(--color-text-primary, #1f2937);
    }
    
    :global([data-theme="dark"]) .close-btn {
        color: #94a3b8;
    }
    
    :global([data-theme="dark"]) .close-btn:hover {
        color: #f1f5f9;
    }
    
    .custom-picker-body {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .date-input-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .date-input-group label {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--color-text-secondary, #6b7280);
    }
    
    :global([data-theme="dark"]) .date-input-group label {
        color: #94a3b8;
    }
    
    .date-input-group input[type="date"] {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        font-size: 0.875rem;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
    }
    
    .date-input-group input[type="date"]:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    :global([data-theme="dark"]) .date-input-group input[type="date"] {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
    }
    
    :global([data-theme="dark"]) .date-input-group input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
    }
    
    .custom-picker-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--color-border, #e2e8f0);
        background: var(--color-surface-secondary, #f8fafc);
        border-radius: 0 0 8px 8px;
    }
    
    :global([data-theme="dark"]) .custom-picker-footer {
        background: #0f172a;
        border-color: #334155;
    }
    
    .btn-cancel, .btn-apply {
        padding: 0.375rem 0.75rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .btn-cancel {
        background: var(--color-surface, #ffffff);
        border: 1px solid var(--color-border, #d1d5db);
        color: var(--color-text-secondary, #6b7280);
    }
    
    .btn-cancel:hover {
        background: var(--color-surface-secondary, #f1f5f9);
    }
    
    :global([data-theme="dark"]) .btn-cancel {
        background: #1e293b;
        border-color: #334155;
        color: #94a3b8;
    }
    
    :global([data-theme="dark"]) .btn-cancel:hover {
        background: #334155;
    }
    
    .btn-apply {
        background: #3b82f6;
        border: none;
        color: white;
    }
    
    .btn-apply:hover {
        background: #2563eb;
    }
</style>
