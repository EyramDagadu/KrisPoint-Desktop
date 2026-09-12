<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authState, permissions } from '$lib/stores/authStore.js';
    import DateFilterDropdown from '$lib/components/DateFilterDropdown.svelte';
    
    let logs = [];
    let loading = true;
    let error = '';
    
    let pagination = { page: 1, limit: 50, total: 0, totalPages: 0 };
    let filters = { categories: [], actions: [], severities: [] };
    
    let searchQuery = '';
    let selectedCategory = '';
    let selectedSeverity = '';
    let selectedAction = '';
    let dateStartFilter = '';
    let dateEndFilter = '';
    let datePreset = 'all';
    
    function handleDateFilterChange(e) {
        dateStartFilter = e.detail.startDate;
        dateEndFilter = e.detail.endDate;
        datePreset = e.detail.preset;
    }
    
    $: canViewAudit = $permissions?.includes('users.manage');
    
    onMount(async () => {
        if (!$authState.isAuthenticated) {
            goto('/auth');
            return;
        }
        
        if (!canViewAudit) {
            goto('/');
            return;
        }
        
        await loadLogs();
    });
    
    async function loadLogs(page = 1) {
        loading = true;
        error = '';
        
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pagination.limit)
            });
            
            if (searchQuery) params.set('search', searchQuery);
            if (selectedCategory) params.set('category', selectedCategory);
            if (selectedSeverity) params.set('severity', selectedSeverity);
            if (selectedAction) params.set('action', selectedAction);
            if (dateStartFilter) params.set('startDate', dateStartFilter);
            if (dateEndFilter) params.set('endDate', dateEndFilter);
            
            const res = await fetch(`/api/admin/audit-logs?${params}`, {
                credentials: 'include'
            });
            
            const data = await res.json();
            
            if (data.success) {
                logs = data.logs;
                pagination = data.pagination;
                filters = data.filters;
            } else {
                error = data.error || 'Failed to load audit logs';
            }
        } catch (err) {
            console.error('Load audit logs error:', err);
            error = 'Failed to load audit logs';
        } finally {
            loading = false;
        }
    }
    
    function applyFilters() {
        loadLogs(1);
    }
    
    function clearFilters() {
        searchQuery = '';
        selectedCategory = '';
        selectedSeverity = '';
        selectedAction = '';
        dateStartFilter = '';
        dateEndFilter = '';
        datePreset = 'all';
        loadLogs(1);
    }
    
    function goToPage(page) {
        if (page >= 1 && page <= pagination.totalPages) {
            loadLogs(page);
        }
    }
    
    function formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    function getSeverityClass(severity) {
        switch (severity) {
            case 'CRITICAL': return 'severity-critical';
            case 'ERROR': return 'severity-error';
            case 'WARNING': return 'severity-warning';
            default: return 'severity-info';
        }
    }
    
    function getCategoryIcon(category) {
        switch (category) {
            case 'AUTH': return '🔐';
            case 'REPORTS': return '📄';
            case 'USERS': return '👤';
            case 'PATIENTS': return '🏥';
            case 'SETTINGS': return '⚙️';
            default: return '📋';
        }
    }
</script>

<svelte:head>
    <title>Audit Logs - KrisPoint Admin</title>
</svelte:head>

<div class="admin-container">
                
                {#if error}
                    <div class="error-banner">
                        <span class="error-icon">!</span>
                        {error}
                        <button class="dismiss-btn" on:click={() => error = ''}>Dismiss</button>
                    </div>
                {/if}
                
                <div class="filters-section">
                    <div class="filters-row">
                        <div class="search-box">
                            <input 
                                type="text" 
                                placeholder="Search logs..."
                                bind:value={searchQuery}
                                on:keydown={(e) => e.key === 'Enter' && applyFilters()}
                            />
                        </div>
                        <select bind:value={selectedCategory} class="filter-select">
                            <option value="">All Categories</option>
                            {#each filters.categories as cat}
                                <option value={cat}>{cat}</option>
                            {/each}
                        </select>
                        <select bind:value={selectedSeverity} class="filter-select">
                            <option value="">All Severities</option>
                            {#each filters.severities as sev}
                                <option value={sev}>{sev}</option>
                            {/each}
                        </select>
                        <select bind:value={selectedAction} class="filter-select">
                            <option value="">All Actions</option>
                            {#each filters.actions as act}
                                <option value={act}>{act}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="filters-row">
                        <DateFilterDropdown 
                            startDate={dateStartFilter}
                            endDate={dateEndFilter}
                            selectedPreset={datePreset}
                            on:change={handleDateFilterChange}
                        />
                        <button class="btn-primary" on:click={applyFilters}>Apply Filters</button>
                        <button class="btn-secondary" on:click={clearFilters}>Clear</button>
                    </div>
                </div>
                
                {#if loading}
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading audit logs...</p>
                    </div>
                {:else}
                    <div class="logs-table-container">
                        <table class="logs-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Category</th>
                                    <th>Action</th>
                                    <th>Severity</th>
                                    <th>Description</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each logs as log}
                                    <tr class={getSeverityClass(log.severity)}>
                                        <td class="timestamp-cell">{formatDate(log.createdAt)}</td>
                                        <td>
                                            <div class="user-cell">
                                                <span class="username">{log.username || '-'}</span>
                                                {#if log.userRole}
                                                    <span class="user-role">{log.userRole}</span>
                                                {/if}
                                            </div>
                                        </td>
                                        <td>
                                            <span class="category-badge">
                                                {getCategoryIcon(log.category)} {log.category}
                                            </span>
                                        </td>
                                        <td class="action-cell">{log.action}</td>
                                        <td>
                                            <span class="severity-badge {getSeverityClass(log.severity)}">
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td class="description-cell">{log.description || '-'}</td>
                                        <td class="ip-cell">{log.ipAddress || '-'}</td>
                                    </tr>
                                {:else}
                                    <tr>
                                        <td colspan="7" class="empty-state">
                                            <p>No audit logs found</p>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="pagination-footer">
                        <span class="log-count">
                            Showing {logs.length} of {pagination.total} logs
                        </span>
                        <div class="pagination-controls">
                            <button 
                                class="page-btn" 
                                disabled={pagination.page <= 1}
                                on:click={() => goToPage(pagination.page - 1)}
                            >
                                Previous
                            </button>
                            <span class="page-info">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button 
                                class="page-btn" 
                                disabled={pagination.page >= pagination.totalPages}
                                on:click={() => goToPage(pagination.page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                {/if}
</div>

<style>
    .admin-container {
        max-width: 100%;
        margin: 0 auto;
        overflow-x: auto;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
    }
    
    .header-left h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary, #1f2937);
        margin: 0 0 0.25rem 0;
    }
    
    .subtitle {
        color: var(--text-secondary, #6b7280);
        font-size: 0.95rem;
        margin: 0;
    }
    
    .error-banner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #dc2626;
        margin-bottom: 1.5rem;
    }
    
    .error-icon {
        width: 24px;
        height: 24px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    
    .dismiss-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: #dc2626;
        cursor: pointer;
        text-decoration: underline;
    }
    
    .filters-section {
        background: white;
        padding: 1.25rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
    }
    
    .filters-row {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .filters-row:last-child {
        margin-bottom: 0;
    }
    
    .search-box {
        flex: 1;
        min-width: 200px;
    }
    
    .search-box input {
        width: 100%;
        padding: 0.625rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.9rem;
    }
    
    .filter-select {
        padding: 0.625rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.9rem;
        background: white;
        min-width: 150px;
    }
    
    .date-filter {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .date-filter label {
        font-size: 0.875rem;
        color: #6b7280;
    }
    
    .date-filter input {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
    }
    
    .btn-primary {
        padding: 0.625rem 1.25rem;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .btn-secondary {
        padding: 0.625rem 1.25rem;
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .btn-secondary:hover {
        background: #f3f4f6;
    }
    
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        color: #6b7280;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 1rem;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .logs-table-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow-x: auto;
    }
    
    .logs-table {
        width: 100%;
        min-width: 900px;
        border-collapse: collapse;
        table-layout: fixed;
    }
    
    .logs-table th {
        text-align: left;
        padding: 0.875rem 0.75rem;
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .logs-table th:nth-child(1) { width: 160px; min-width: 160px; }
    .logs-table th:nth-child(2) { width: 150px; min-width: 150px; }
    .logs-table th:nth-child(3) { width: 100px; }
    .logs-table th:nth-child(4) { width: 130px; }
    .logs-table th:nth-child(5) { width: 90px; }
    .logs-table th:nth-child(6) { width: auto; }
    .logs-table th:nth-child(7) { width: 120px; }
    
    .logs-table td {
        padding: 0.75rem 0.75rem;
        border-bottom: 1px solid #f3f4f6;
        font-size: 0.875rem;
        color: #374151;
        vertical-align: middle;
        overflow-wrap: break-word;
        word-wrap: break-word;
    }
    
    .logs-table tr:hover {
        background: #f9fafb;
    }
    
    .timestamp-cell {
        white-space: nowrap;
        color: #6b7280;
        font-size: 0.8rem;
        min-width: 140px;
        padding-right: 1rem;
    }
    
    .user-cell {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        max-width: 150px;
    }
    
    .username {
        font-weight: 500;
        overflow-wrap: break-word;
        word-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
    }
    
    .user-role {
        font-size: 0.75rem;
        color: #9ca3af;
    }
    
    .category-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        background: #f3f4f6;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .action-cell {
        font-family: monospace;
        font-size: 0.8rem;
        overflow-wrap: break-word;
        word-wrap: break-word;
        word-break: break-all;
    }
    
    .severity-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .severity-info {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .severity-warning {
        background: #fef3c7;
        color: #92400e;
    }
    
    .severity-error {
        background: #fee2e2;
        color: #dc2626;
    }
    
    .severity-critical {
        background: #fecaca;
        color: #991b1b;
    }
    
    .description-cell {
        max-width: 100%;
        overflow-wrap: break-word;
        word-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
    }
    
    .ip-cell {
        font-family: monospace;
        font-size: 0.8rem;
        color: #6b7280;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #9ca3af;
    }
    
    .pagination-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: white;
        border-radius: 0 0 12px 12px;
        margin-top: -1px;
    }
    
    .log-count {
        font-size: 0.875rem;
        color: #6b7280;
    }
    
    .pagination-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .page-btn {
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background 0.2s;
    }
    
    .page-btn:hover:not(:disabled) {
        background: #f3f4f6;
    }
    
    .page-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .page-info {
        font-size: 0.875rem;
        color: #6b7280;
    }

    /* Dark theme support */
    :global([data-theme="dark"]) .filters-section {
        background: #1e293b;
    }

    :global([data-theme="dark"]) .search-box input {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .search-box input::placeholder {
        color: #64748b;
    }

    :global([data-theme="dark"]) .filter-select {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .date-filter input {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .date-filter label {
        color: #94a3b8;
    }

    :global([data-theme="dark"]) .btn-secondary {
        background: #334155;
        border-color: #475569;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .btn-secondary:hover {
        background: #475569;
    }

    :global([data-theme="dark"]) .logs-table-container {
        background: #1e293b;
    }

    :global([data-theme="dark"]) .logs-table th {
        background: #0f172a;
        color: #94a3b8;
        border-bottom-color: #334155;
    }

    :global([data-theme="dark"]) .logs-table td {
        border-bottom-color: #334155;
    }

    :global([data-theme="dark"]) .logs-table tbody tr:hover {
        background: #f9fafb;
    }
    
    :global([data-theme="dark"]) .logs-table tbody tr:hover td {
        color: #1e293b;
    }

    :global([data-theme="dark"]) .pagination-footer {
        background: #1e293b;
    }

    :global([data-theme="dark"]) .page-btn {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .page-btn:hover:not(:disabled) {
        background: #334155;
    }

    :global([data-theme="dark"]) .log-count,
    :global([data-theme="dark"]) .page-info {
        color: #94a3b8;
    }

    :global([data-theme="dark"]) .ip-cell {
        color: #94a3b8;
    }

    :global([data-theme="dark"]) .empty-state {
        color: #64748b;
    }
</style>
