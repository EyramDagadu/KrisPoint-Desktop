<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { currentUser, permissions } from '$lib/stores/authStore';
    import DateFilterDropdown from '$lib/components/DateFilterDropdown.svelte';
    
    let reports: any[] = [];
    let addendums: any[] = [];
    let loading = true;
    let error = '';
    let viewMode: 'card' | 'table' = 'card';
    let dateStartFilter = '';
    let dateEndFilter = '';
    let datePreset = 'all';
    let selectedModality = '';
    
    const modalities = ['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy', 'Nuclear Medicine', 'PET-CT'];
    
    $: canSubmit = $permissions.includes('reports.submit');
    
    function handleDateFilterChange(e: CustomEvent) {
        dateStartFilter = e.detail.startDate;
        dateEndFilter = e.detail.endDate;
        datePreset = e.detail.preset;
    }
    
    $: filteredReports = reports.filter(r => {
        const matchesModality = !selectedModality || r.modality === selectedModality;
        let matchesDate = true;
        if ((dateStartFilter || dateEndFilter) && r.studyDate) {
            const reportDate = new Date(r.studyDate).toISOString().split('T')[0];
            if (dateStartFilter && dateEndFilter) {
                matchesDate = reportDate >= dateStartFilter && reportDate <= dateEndFilter;
            } else if (dateStartFilter) {
                matchesDate = reportDate >= dateStartFilter;
            } else if (dateEndFilter) {
                matchesDate = reportDate <= dateEndFilter;
            }
        }
        return matchesModality && matchesDate;
    });
    $: filteredAddendums = addendums.filter(a => {
        const matchesModality = !selectedModality || a.modality === selectedModality;
        let matchesDate = true;
        if ((dateStartFilter || dateEndFilter) && a.studyDate) {
            const addendumDate = new Date(a.studyDate).toISOString().split('T')[0];
            if (dateStartFilter && dateEndFilter) {
                matchesDate = addendumDate >= dateStartFilter && addendumDate <= dateEndFilter;
            } else if (dateStartFilter) {
                matchesDate = addendumDate >= dateStartFilter;
            } else if (dateEndFilter) {
                matchesDate = addendumDate <= dateEndFilter;
            }
        }
        return matchesModality && matchesDate;
    });
    $: hasItems = reports.length > 0 || addendums.length > 0;
    $: hasFilteredItems = filteredReports.length > 0 || filteredAddendums.length > 0;
    
    onMount(async () => {
        if (!$currentUser) {
            goto('/auth');
            return;
        }
        if (!canSubmit) {
            goto('/');
            return;
        }
        await loadReports();
    });
    
    async function loadReports() {
        loading = true;
        error = '';
        
        try {
            const res = await fetch('/api/reports/returned', {
                credentials: 'include'
            });
            
            const data = await res.json();
            if (data.success) {
                reports = data.reports || [];
                addendums = data.addendums || [];
            } else {
                error = data.error;
            }
        } catch (err) {
            error = 'Failed to load returned reports';
        } finally {
            loading = false;
        }
    }
    
    function formatDate(dateStr: string) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    function formatDuration(returnedAt: string) {
        if (!returnedAt) return '-';
        const diff = Date.now() - new Date(returnedAt).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        }
        if (hours > 0) return `${hours}h ${minutes}m ago`;
        return `${minutes}m ago`;
    }
    
    function getPriorityClass(priority: string) {
        switch (priority) {
            case 'STAT': return 'priority-stat';
            case 'URGENT': return 'priority-urgent';
            default: return 'priority-routine';
        }
    }
    
    function openReport(reportId: number) {
        goto(`/reporting?reportId=${reportId}`);
    }
    
    function openAddendum(reportId: number, addendumId: number) {
        goto(`/reporting?reportId=${reportId}&addendumId=${addendumId}`);
    }
</script>

<div class="returned-reports-page">
    
    {#if error}
        <div class="error-message">{error}</div>
    {/if}
    
    <div class="page-controls">
        <DateFilterDropdown 
            startDate={dateStartFilter}
            endDate={dateEndFilter}
            selectedPreset={datePreset}
            on:change={handleDateFilterChange}
        />
        <select class="modality-filter" bind:value={selectedModality}>
            <option value="">All Modalities</option>
            {#each modalities as mod}
                <option value={mod}>{mod}</option>
            {/each}
        </select>
        {#if datePreset !== 'all' || selectedModality}
            <button class="btn-clear" on:click={() => { dateStartFilter = ''; dateEndFilter = ''; datePreset = 'all'; selectedModality = ''; }} title="Clear filters">
                Clear
            </button>
        {/if}
        <div class="view-toggle">
            <button 
                class="toggle-btn" 
                class:active={viewMode === 'card'} 
                on:click={() => viewMode = 'card'}
                title="Card View"
            >&#9638;</button>
            <button 
                class="toggle-btn" 
                class:active={viewMode === 'table'} 
                on:click={() => viewMode = 'table'}
                title="Table View"
            >&#9776;</button>
        </div>
    </div>

    {#if loading}
        <div class="loading">Loading returned items...</div>
    {:else if !hasItems}
        <div class="empty-state">
            <div class="empty-icon">✓</div>
            <p>No returned items</p>
            <span>Reports and addendums returned by specialists will appear here.</span>
        </div>
    {:else if !hasFilteredItems}
        <div class="empty-state">
            <p>No items match your filters</p>
            <button class="btn-clear" on:click={() => { dateStartFilter = ''; dateEndFilter = ''; datePreset = 'all'; selectedModality = ''; }}>Clear Filters</button>
        </div>
    {:else}
        {#if filteredReports.length > 0}
            <h2 class="section-title">Returned Reports ({filteredReports.length})</h2>
            {#if viewMode === 'table'}
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Report ID</th>
                                <th>Priority</th>
                                <th>Patient</th>
                                <th>Hospital No</th>
                                <th>Modality</th>
                                <th>Body Region</th>
                                <th>Returned By</th>
                                <th>Feedback</th>
                                <th>Returned</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each filteredReports as report}
                                <tr>
                                    <td class="report-id-cell">R-{report.id}</td>
                                    <td><span class="priority-badge {getPriorityClass(report.priority)}">{report.priority}</span></td>
                                    <td>{report.patientFirstName} {report.patientLastName}</td>
                                    <td>{report.patientMrn}</td>
                                    <td>{report.modality}</td>
                                    <td>{report.bodyRegion || '-'}</td>
                                    <td>{report.returnedBy || report.specialistName || '-'}</td>
                                    <td class="feedback-cell">{report.returnReason || '-'}</td>
                                    <td class="return-time">{formatDuration(report.returnedAt)}</td>
                                    <td>
                                        <button class="btn-action btn-revise" on:click={() => openReport(report.id)}>Revise</button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
            <div class="reports-grid">
                {#each filteredReports as report}
                    <div class="report-card" on:click={() => openReport(report.id)}>
                        <div class="card-header">
                            <span class="report-id-badge">R-{report.id}</span>
                            <span class="priority-badge {getPriorityClass(report.priority)}">
                                {report.priority}
                            </span>
                            <span class="modality-badge">{report.modality}</span>
                            <span class="returned-badge">↩️ Returned</span>
                        </div>
                        
                        <div class="patient-info">
                            <h3>{report.patientFirstName} {report.patientLastName}</h3>
                            <span class="mrn">Hospital No: {report.patientMrn}</span>
                        </div>
                        
                        <div class="report-details">
                            <div class="detail-row">
                                <span class="label">Body Region:</span>
                                <span>{report.bodyRegion || '-'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Returned by:</span>
                                <span>{report.returnedBy || report.specialistName || '-'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Returned:</span>
                                <span class="return-time">{formatDuration(report.returnedAt)}</span>
                            </div>
                        </div>
                        
                        {#if report.indication}
                            <div class="indication">
                                <span class="label">Indication:</span>
                                <p>{report.indication}</p>
                            </div>
                        {/if}
                        
                        {#if report.returnReason}
                            <div class="return-message">
                                <span class="label">Specialist feedback:</span>
                                <p>{report.returnReason}</p>
                            </div>
                        {/if}
                        
                        <button class="revise-btn">Revise Report</button>
                    </div>
                {/each}
            </div>
            {/if}
        {/if}
        
        {#if filteredAddendums.length > 0}
            <h2 class="section-title" class:with-gap={filteredReports.length > 0}>Returned Addendums ({filteredAddendums.length})</h2>
            {#if viewMode === 'table'}
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Report ID</th>
                                <th>Type</th>
                                <th>Patient</th>
                                <th>Hospital No</th>
                                <th>Modality</th>
                                <th>Body Region</th>
                                <th>Returned By</th>
                                <th>Reason</th>
                                <th>Feedback</th>
                                <th>Returned</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each filteredAddendums as addendum}
                                <tr>
                                    <td class="report-id-cell">R-{addendum.reportId}</td>
                                    <td><span class="addendum-badge">ADDENDUM</span></td>
                                    <td>{addendum.patientFirstName} {addendum.patientLastName}</td>
                                    <td>{addendum.patientMrn}</td>
                                    <td>{addendum.modality}</td>
                                    <td>{addendum.bodyRegion || '-'}</td>
                                    <td>{addendum.returnedBy || addendum.specialistName || '-'}</td>
                                    <td class="reason-cell">{addendum.reason || '-'}</td>
                                    <td class="feedback-cell">{addendum.returnReason || '-'}</td>
                                    <td class="return-time">{formatDuration(addendum.returnedAt)}</td>
                                    <td>
                                        <button class="btn-action btn-revise" on:click={() => openAddendum(addendum.reportId, addendum.id)}>Revise</button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
            <div class="reports-grid">
                {#each filteredAddendums as addendum}
                    <div class="report-card addendum-card" on:click={() => openAddendum(addendum.reportId, addendum.id)}>
                        <div class="card-header">
                            <span class="report-id-badge">R-{addendum.reportId}</span>
                            <span class="priority-badge {getPriorityClass(addendum.priority)}">
                                {addendum.priority}
                            </span>
                            <span class="modality-badge">{addendum.modality}</span>
                            <span class="addendum-badge">📝 Addendum</span>
                            <span class="returned-badge">↩️ Returned</span>
                        </div>
                        
                        <div class="patient-info">
                            <h3>{addendum.patientFirstName} {addendum.patientLastName}</h3>
                            <span class="mrn">Hospital No: {addendum.patientMrn}</span>
                        </div>
                        
                        <div class="report-details">
                            <div class="detail-row">
                                <span class="label">Body Region:</span>
                                <span>{addendum.bodyRegion || '-'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Returned by:</span>
                                <span>{addendum.returnedBy || addendum.specialistName || '-'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Returned:</span>
                                <span class="return-time">{formatDuration(addendum.returnedAt)}</span>
                            </div>
                        </div>
                        
                        {#if addendum.reason}
                            <div class="indication">
                                <span class="label">Addendum Reason:</span>
                                <p>{addendum.reason}</p>
                            </div>
                        {/if}
                        
                        {#if addendum.returnReason}
                            <div class="return-message">
                                <span class="label">Specialist feedback:</span>
                                <p>{addendum.returnReason}</p>
                            </div>
                        {/if}
                        
                        <button class="revise-btn">Revise Addendum</button>
                    </div>
                {/each}
            </div>
            {/if}
        {/if}
    {/if}
</div>

<style>
    .returned-reports-page {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }
    
    .page-header {
        margin-bottom: 2rem;
    }
    
    .page-controls {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }
    
    .view-toggle {
        display: flex;
        gap: 0.25rem;
        margin-left: auto;
    }
    
    .toggle-btn {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--color-border, #d1d5db);
        background: var(--color-surface, #ffffff);
        color: var(--color-text-secondary, #6b7280);
        cursor: pointer;
        font-size: 1rem;
    }
    
    .toggle-btn:first-child {
        border-radius: 6px 0 0 6px;
    }
    
    .toggle-btn:last-child {
        border-radius: 0 6px 6px 0;
    }
    
    .toggle-btn.active {
        background: var(--color-primary, #3b82f6);
        color: white;
        border-color: var(--color-primary, #3b82f6);
    }
    
    .table-container {
        overflow-x: auto;
        margin-bottom: 2rem;
    }
    
    .data-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--color-surface, #ffffff);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    :global([data-theme="dark"]) .data-table {
        background: #1e293b;
    }
    
    .data-table th,
    .data-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    :global([data-theme="dark"]) .data-table th,
    :global([data-theme="dark"]) .data-table td {
        border-bottom-color: #334155;
    }
    
    .data-table th {
        background: var(--color-bg-secondary, #f9fafb);
        font-weight: 600;
        color: var(--color-text-primary, #1f2937);
        font-size: 0.8rem;
        text-transform: uppercase;
    }

    :global([data-theme="dark"]) .data-table th {
        background: #0f172a;
        color: #e2e8f0;
    }
    
    .data-table td {
        color: var(--color-text-primary, #1f2937);
        font-size: 0.875rem;
    }

    :global([data-theme="dark"]) .data-table td {
        color: #f1f5f9;
    }
    
    .report-id-cell {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.8rem;
        color: #64748b;
    }
    
    :global([data-theme="dark"]) .report-id-cell {
        color: #93c5fd;
    }
    
    .data-table tbody tr:hover {
        background: var(--color-bg-secondary, #f9fafb);
    }

    :global([data-theme="dark"]) .data-table tbody tr:hover {
        background: #334155;
    }
    
    .btn-action {
        padding: 0.4rem 0.75rem;
        border: none;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
    }
    
    .btn-revise {
        background: #2563eb;
        color: white;
    }
    
    .btn-revise:hover {
        background: #1d4ed8;
    }

    .date-filter-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
    }

    .date-filter {
        padding: 0.5rem 2.5rem 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        font-size: 0.95rem;
        cursor: pointer;
    }

    :global([data-theme="dark"]) .date-filter {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }

    .date-filter::-webkit-calendar-picker-indicator {
        opacity: 0;
        position: absolute;
        right: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
    }

    .calendar-icon {
        position: absolute;
        right: 0.75rem;
        width: 18px;
        height: 18px;
        pointer-events: none;
        color: var(--color-text-secondary, #6b7280);
    }

    :global([data-theme="dark"]) .calendar-icon {
        color: #94a3b8;
    }

    .date-filter:focus {
        outline: none;
        border-color: var(--color-primary, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .modality-filter {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        font-size: 0.95rem;
        cursor: pointer;
    }

    :global([data-theme="dark"]) .modality-filter {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .modality-filter option {
        background: #1e293b;
        color: #f1f5f9;
    }

    .btn-clear {
        padding: 0.5rem 1rem;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-secondary, #6b7280);
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
    }

    .btn-clear:hover {
        background: var(--color-border, #e5e7eb);
        color: var(--color-text-primary, #1f2937);
    }

    :global([data-theme="dark"]) .btn-clear {
        background: #1e293b;
        border-color: #334155;
        color: #94a3b8;
    }

    :global([data-theme="dark"]) .btn-clear:hover {
        background: #334155;
        color: #f1f5f9;
    }
    
    .feedback-cell,
    .reason-cell {
        max-width: 150px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .section-title {
        font-size: 1.25rem;
        color: var(--text-primary);
        margin: 0 0 1rem 0;
    }
    
    .section-title.with-gap {
        margin-top: 2rem;
    }
    
    .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        color: var(--text-primary);
    }
    
    .subtitle {
        margin: 0.5rem 0 0;
        color: var(--text-secondary);
    }
    
    .addendum-badge {
        background: #eff6ff;
        color: #2563eb;
    }
    
    .addendum-card {
        border-left-color: #2563eb;
    }
    
    .error-message {
        background: #fee2e2;
        color: #dc2626;
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }
    
    .loading {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }
    
    .empty-state {
        text-align: center;
        padding: 4rem;
        background: var(--bg-secondary);
        border-radius: 12px;
    }
    
    .empty-icon {
        font-size: 3rem;
        color: #16a34a;
        margin-bottom: 1rem;
    }
    
    .empty-state p {
        font-size: 1.25rem;
        color: var(--text-primary);
        margin: 0;
    }
    
    .empty-state span {
        color: var(--text-secondary);
    }
    
    .reports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
    }
    
    .report-card {
        background: var(--bg-primary);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        border-left: 4px solid #f59e0b;
    }
    
    .report-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .card-header {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    
    .priority-badge, .modality-badge, .returned-badge, .report-id-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .report-id-badge {
        background: #1e3a5f;
        color: #93c5fd;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }
    
    .priority-stat {
        background: #fef2f2;
        color: #dc2626;
    }
    
    .priority-urgent {
        background: #fffbeb;
        color: #d97706;
    }
    
    .priority-routine {
        background: #f0fdf4;
        color: #16a34a;
    }
    
    .modality-badge {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
    
    .returned-badge {
        background: #fffbeb;
        color: #d97706;
    }
    
    .patient-info {
        margin-bottom: 1rem;
    }
    
    .patient-info h3 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--text-primary);
    }
    
    .mrn {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .report-details {
        margin-bottom: 1rem;
    }
    
    .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        font-size: 0.875rem;
    }
    
    .label {
        color: var(--text-secondary);
    }
    
    .return-time {
        color: #d97706;
        font-weight: 500;
    }
    
    .indication {
        background: var(--bg-secondary);
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }
    
    .indication .label {
        font-size: 0.75rem;
        text-transform: uppercase;
    }
    
    .indication p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-primary);
    }
    
    .return-message {
        background: #fef3c7;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        border-left: 3px solid #f59e0b;
    }
    
    .return-message .label {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #b45309;
    }
    
    .return-message p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: #78350f;
        font-style: italic;
    }
    
    .revise-btn {
        width: 100%;
        padding: 0.75rem;
        background: #f59e0b;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
    }
    
    .revise-btn:hover {
        background: #d97706;
    }
</style>
