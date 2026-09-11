<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { currentUser, permissions } from '$lib/stores/authStore';
    import DateFilterDropdown from '$lib/components/DateFilterDropdown.svelte';
    import { formatModality } from '$lib/utils/formatters.js';
    import { SSEManager } from '$lib/services/SSEManager';
    
    const SSE_ID = 'pending-reviews';
    let reports: any[] = [];
    let addendums: any[] = [];
    let loading = true;
    let error = '';
    let currentUserId: number | null = null;
    let eventSource: EventSource | null = null;
    let selectedFilter = 'mine';
    let selectedModality = '';
    let dateStartFilter = '';
    let dateEndFilter = '';
    let datePreset = 'all';
    let viewMode: 'card' | 'table' = 'card';
    let claiming = false;
    let showClaimConfirm = false;
    let reportToClaim: number | null = null;
    
    const modalities = ['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy', 'Nuclear Medicine', 'PET-CT'];
    
    $: canReview = $permissions.includes('reports.review');
    
    function handleDateFilterChange(e: CustomEvent) {
        dateStartFilter = e.detail.startDate;
        dateEndFilter = e.detail.endDate;
        datePreset = e.detail.preset;
    }
    
    $: filteredReports = reports.filter(r => {
        const formattedModality = formatModality(r.modality);
        const matchesModality = !selectedModality || formattedModality === selectedModality;
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
        const formattedModality = formatModality(a.modality);
        const matchesModality = !selectedModality || formattedModality === selectedModality;
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
    $: totalPending = filteredReports.length + filteredAddendums.length;
    
    onMount(async () => {
        if (!$currentUser) {
            goto('/auth');
            return;
        }
        if (!canReview) {
            goto('/');
            return;
        }
        await loadReports();
        setupEventSource();
    });
    
    onDestroy(() => {
        SSEManager.unregister(SSE_ID);
        eventSource = null;
    });
    
    function setupEventSource() {
        SSEManager.unregister(SSE_ID);
        
        eventSource = new EventSource('/api/reports/events');
        SSEManager.register(SSE_ID, eventSource);
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'report_claimed') {
                    // Update the reports list when a report is claimed
                    reports = reports.map(r => {
                        if (r.id === data.reportId) {
                            return { ...r, assignedSpecialistId: data.newSpecialistId };
                        }
                        return r;
                    });
                }
            } catch (e) {
                // Ignore parse errors
            }
        };
        
        eventSource.onerror = () => {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
            setTimeout(() => {
                if ($currentUser) {
                    setupEventSource();
                }
            }, 5000);
        };
    }
    
    async function loadReports() {
        loading = true;
        error = '';
        
        try {
            const res = await fetch(`/api/reports/pending-reviews?filter=${selectedFilter}`, {
                credentials: 'include'
            });
            
            const data = await res.json();
            if (data.success) {
                reports = data.reports;
                addendums = data.addendums || [];
                currentUserId = data.currentUserId;
            } else {
                error = data.error;
            }
        } catch (err) {
            error = 'Failed to load pending reviews';
        } finally {
            loading = false;
        }
    }
    
    function handleFilterChange() {
        loadReports();
    }
    
    function formatDoctorName(fullName: string | null): string {
        if (!fullName) return '-';
        const parts = fullName.trim().split(/\s+/);
        const surname = parts[parts.length - 1];
        return `Dr ${surname}`;
    }
    
    function promptClaimReport(reportId: number, event: Event) {
        event.stopPropagation();
        reportToClaim = reportId;
        showClaimConfirm = true;
    }
    
    function cancelClaim() {
        showClaimConfirm = false;
        reportToClaim = null;
    }
    
    async function confirmClaimReport() {
        if (!reportToClaim || claiming) return;
        claiming = true;
        showClaimConfirm = false;
        
        try {
            const res = await fetch(`/api/reports/${reportToClaim}/claim`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await res.json();
            if (data.success) {
                await loadReports();
            } else {
                error = data.error || 'Failed to claim report';
            }
        } catch (err) {
            error = 'Failed to claim report';
        } finally {
            claiming = false;
            reportToClaim = null;
        }
    }
    
    async function claimAddendum(reportId: number, addendumId: number, event: Event) {
        event.stopPropagation();
        if (claiming) return;
        claiming = true;
        
        try {
            const res = await fetch(`/api/reports/${reportId}/addendums/${addendumId}/claim`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await res.json();
            if (data.success) {
                await loadReports();
            } else {
                error = data.error || 'Failed to claim addendum';
            }
        } catch (err) {
            error = 'Failed to claim addendum';
        } finally {
            claiming = false;
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
    
    function formatDuration(submittedAt: string) {
        if (!submittedAt) return '-';
        const diff = Date.now() - new Date(submittedAt).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
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
        goto(`/reporting?reportId=${reportId}&review=true`);
    }
    
    function openAddendumReport(reportId: number) {
        goto(`/reporting?reportId=${reportId}&review=true&showAddendums=true`);
    }
</script>

<div class="pending-reviews-page">
    <div class="page-controls">
        <select class="filter-select" bind:value={selectedFilter} on:change={handleFilterChange}>
            <option value="mine">Assigned to Me</option>
            <option value="all">All Pending Reviews</option>
        </select>
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
            <button class="toggle-btn" class:active={viewMode === 'card'} on:click={() => viewMode = 'card'} title="Card View">
                &#9638;
            </button>
            <button class="toggle-btn" class:active={viewMode === 'table'} on:click={() => viewMode = 'table'} title="Table View">
                &#9776;
            </button>
        </div>
    </div>
    
    {#if error}
        <div class="error-message">{error}</div>
    {/if}
    
    {#if loading}
        <div class="loading">Loading pending reviews...</div>
    {:else if totalPending === 0}
        <div class="empty-state">
            <div class="empty-icon">&#10003;</div>
            <p>No pending reviews</p>
            <span>{selectedFilter === 'mine' ? 'All caught up! Reports and addendums submitted to you will appear here.' : 'No pending reviews in the system.'}</span>
        </div>
    {:else}
        {#if filteredReports.length > 0}
            <div class="section-header">
                <h2>Pending Reports ({filteredReports.length})</h2>
            </div>
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
                                <th>Submitted By</th>
                                {#if selectedFilter === 'all'}<th>Assigned To</th>{/if}
                                <th>Waiting</th>
                                <th class="action-col">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each filteredReports as report}
                                <tr>
                                    <td class="report-id-cell">R-{report.id}</td>
                                    <td><span class="priority-badge {getPriorityClass(report.priority)}">{report.priority}</span></td>
                                    <td>{report.patientFirstName} {report.patientLastName}</td>
                                    <td>{report.patientMrn}</td>
                                    <td>{formatModality(report.modality)}</td>
                                    <td>{report.bodyRegion || '-'}</td>
                                    <td>{formatDoctorName(report.submitterName)}</td>
                                    {#if selectedFilter === 'all'}
                                        <td class:assigned-to-me={report.assignedSpecialistId === currentUserId}>
                                            {formatDoctorName(report.assignedSpecialistName)}
                                            {#if report.assignedSpecialistId === currentUserId}(me){/if}
                                        </td>
                                    {/if}
                                    <td class="waiting-time">{formatDuration(report.submittedAt)}</td>
                                    <td class="action-col">
                                        {#if Number(report.assignedSpecialistId) !== Number(currentUserId)}
                                            <button class="btn-action btn-claim" on:click={(e) => promptClaimReport(report.id, e)} disabled={claiming}>Claim</button>
                                        {:else}
                                            <button class="btn-action btn-review" on:click={() => openReport(report.id)}>Review</button>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
            <div class="reports-grid">
                {#each filteredReports as report}
                    <div class="report-card" role="button" tabindex="0" on:click={() => openReport(report.id)} on:keypress={(e) => e.key === 'Enter' && openReport(report.id)}>
                        <div class="card-header">
                            <span class="report-id-badge">R-{report.id}</span>
                            <span class="priority-badge {getPriorityClass(report.priority)}">
                                {report.priority}
                            </span>
                            <span class="modality-badge">{formatModality(report.modality)}</span>
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
                                <span class="label">Submitted by:</span>
                                <span>{formatDoctorName(report.submitterName)}</span>
                            </div>
                            {#if selectedFilter === 'all'}
                                <div class="detail-row">
                                    <span class="label">Assigned to:</span>
                                    <span class:assigned-to-me={report.assignedSpecialistId === currentUserId}>
                                        {formatDoctorName(report.assignedSpecialistName)}
                                        {#if report.assignedSpecialistId === currentUserId}(me){/if}
                                    </span>
                                </div>
                            {/if}
                            <div class="detail-row">
                                <span class="label">Waiting:</span>
                                <span class="waiting-time">{formatDuration(report.submittedAt)}</span>
                            </div>
                        </div>
                        
                        {#if report.indication}
                            <div class="indication">
                                <span class="label">Indication:</span>
                                <p>{report.indication}</p>
                            </div>
                        {/if}
                        
                        {#if report.submissionMessage}
                            <div class="submission-message">
                                <span class="label">Message from submitter:</span>
                                <p>{report.submissionMessage}</p>
                            </div>
                        {/if}
                        
                        <div class="card-actions">
                            {#if Number(report.assignedSpecialistId) !== Number(currentUserId)}
                                <button class="claim-btn" on:click={(e) => promptClaimReport(report.id, e)} disabled={claiming}>
                                    {claiming ? 'Claiming...' : 'Claim Case'}
                                </button>
                            {:else}
                                <span class="review-btn">Review Report</span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
            {/if}
        {/if}
        
        {#if filteredAddendums.length > 0}
            <div class="section-header addendums-section">
                <h2>Pending Addendums ({filteredAddendums.length})</h2>
            </div>
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
                                <th>Submitted By</th>
                                {#if selectedFilter === 'all'}<th>Assigned To</th>{/if}
                                <th>Reason</th>
                                <th>Waiting</th>
                                <th class="action-col">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each filteredAddendums as addendum}
                                <tr>
                                    <td class="report-id-cell">R-{addendum.reportId}</td>
                                    <td><span class="addendum-badge">ADDENDUM</span></td>
                                    <td>{addendum.patientFirstName} {addendum.patientLastName}</td>
                                    <td>{addendum.patientMrn}</td>
                                    <td>{formatModality(addendum.modality)}</td>
                                    <td>{addendum.bodyRegion || '-'}</td>
                                    <td>{formatDoctorName(addendum.creatorName)}</td>
                                    {#if selectedFilter === 'all'}
                                        <td class:assigned-to-me={addendum.assignedSpecialistId === currentUserId}>
                                            {formatDoctorName(addendum.assignedSpecialistName)}
                                            {#if addendum.assignedSpecialistId === currentUserId}(me){/if}
                                        </td>
                                    {/if}
                                    <td class="reason-cell">{addendum.reason}</td>
                                    <td class="waiting-time">{formatDuration(addendum.submittedAt)}</td>
                                    <td class="action-col">
                                        {#if Number(addendum.assignedSpecialistId) !== Number(currentUserId)}
                                            <button class="btn-action btn-claim" on:click={(e) => claimAddendum(addendum.reportId, addendum.id, e)} disabled={claiming}>Claim</button>
                                        {:else}
                                            <button class="btn-action btn-review" on:click={() => openAddendumReport(addendum.reportId)}>Review</button>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
            <div class="reports-grid">
                {#each filteredAddendums as addendum}
                    <div class="report-card addendum-card" role="button" tabindex="0" on:click={() => openAddendumReport(addendum.reportId)} on:keypress={(e) => e.key === 'Enter' && openAddendumReport(addendum.reportId)}>
                        <div class="card-header">
                            <span class="report-id-badge">R-{addendum.reportId}</span>
                            <span class="addendum-badge">ADDENDUM</span>
                            <span class="modality-badge">{formatModality(addendum.modality)}</span>
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
                                <span class="label">Submitted by:</span>
                                <span>{formatDoctorName(addendum.creatorName)}</span>
                            </div>
                            {#if selectedFilter === 'all'}
                                <div class="detail-row">
                                    <span class="label">Assigned to:</span>
                                    <span class:assigned-to-me={addendum.assignedSpecialistId === currentUserId}>
                                        {formatDoctorName(addendum.assignedSpecialistName)}
                                        {#if addendum.assignedSpecialistId === currentUserId}(me){/if}
                                    </span>
                                </div>
                            {/if}
                            <div class="detail-row">
                                <span class="label">Waiting:</span>
                                <span class="waiting-time">{formatDuration(addendum.submittedAt)}</span>
                            </div>
                        </div>
                        
                        <div class="addendum-reason">
                            <span class="label">Reason:</span>
                            <p>{addendum.reason}</p>
                        </div>
                        
                        <div class="card-actions">
                            {#if Number(addendum.assignedSpecialistId) !== Number(currentUserId)}
                                <button class="claim-btn" on:click={(e) => claimAddendum(addendum.reportId, addendum.id, e)} disabled={claiming}>
                                    {claiming ? 'Claiming...' : 'Claim Case'}
                                </button>
                            {:else}
                                <span class="review-btn">Review Addendum</span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
            {/if}
        {/if}
    {/if}
</div>

{#if showClaimConfirm}
    <div class="modal-overlay" role="dialog" aria-modal="true">
        <div class="confirm-modal">
            <div class="confirm-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                </svg>
            </div>
            <h3>Claim This Case?</h3>
            <p>This will assign the report to you for review. The current specialist will no longer be assigned.</p>
            <div class="confirm-actions">
                <button class="btn-cancel" on:click={cancelClaim}>Cancel</button>
                <button class="btn-confirm" on:click={confirmClaimReport}>Yes, Claim Case</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .pending-reviews-page {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }
    
    .page-controls {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
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
    
    .modality-filter {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        font-size: 0.95rem;
        cursor: pointer;
    }
    
    .modality-filter option {
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
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
        font-size: 0.85rem;
        text-transform: uppercase;
    }

    :global([data-theme="dark"]) .data-table th {
        background: #0f172a;
        color: #e2e8f0;
    }
    
    .data-table td {
        color: var(--color-text-primary, #1f2937);
        font-size: 0.9rem;
    }

    :global([data-theme="dark"]) .data-table td {
        color: #f1f5f9;
    }
    
    .report-id-cell {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.85rem;
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
    
    .btn-review {
        background: var(--color-primary, #3b82f6);
        color: white;
    }
    
    .btn-review:hover {
        background: var(--color-primary-hover, #2563eb);
    }
    
    .btn-claim {
        background: #059669;
        color: white;
    }
    
    .btn-claim:hover:not(:disabled) {
        background: #047857;
    }
    
    .btn-claim:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .action-col {
        text-align: center;
    }
    
    .reason-cell {
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .filter-select {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-border, #d1d5db);
        border-radius: 6px;
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
        font-size: 0.95rem;
        cursor: pointer;
    }
    
    .filter-select option {
        background: var(--color-surface, #ffffff);
        color: var(--color-text-primary, #1f2937);
    }
    
    :global([data-theme="dark"]) .filter-select {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }
    
    :global([data-theme="dark"]) .filter-select option {
        background: #1e293b;
        color: #f1f5f9;
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

    :global([data-theme="dark"]) .addendum-reason {
        background: #1e1b4b;
        border-left-color: #8b5cf6;
    }

    :global([data-theme="dark"]) .addendum-reason .label {
        color: #a78bfa;
    }

    :global([data-theme="dark"]) .addendum-reason p {
        color: #e2e8f0;
    }

    :global([data-theme="dark"]) .reason-cell {
        color: #e2e8f0;
    }
    
    .page-header {
        margin-bottom: 2rem;
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
        border-left: 4px solid #3b82f6;
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
    
    .priority-badge, .modality-badge, .report-id-badge {
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
    
    .waiting-time {
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
    
    .submission-message {
        background: #eff6ff;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        border-left: 3px solid #3b82f6;
    }
    
    .submission-message .label {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #3b82f6;
    }
    
    .submission-message p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: #1e3a8a;
        font-style: italic;
    }
    
    .card-actions {
        text-align: center;
    }
    
    .review-btn {
        display: inline-block;
        width: 100%;
        padding: 0.75rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        text-align: center;
    }
    
    .review-btn:hover {
        background: #2563eb;
    }
    
    .claim-btn {
        width: 100%;
        padding: 0.75rem;
        background: #059669;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
    }
    
    .claim-btn:hover:not(:disabled) {
        background: #047857;
    }
    
    .claim-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .assigned-to-me {
        color: #059669;
        font-weight: 500;
    }
    
    .section-header {
        margin-bottom: 1rem;
    }
    
    .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary);
    }
    
    .addendums-section {
        margin-top: 2.5rem;
    }
    
    .addendum-card {
        border-left: 4px solid #8b5cf6;
    }
    
    .addendum-badge {
        background: #ede9fe;
        color: #7c3aed;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .addendum-reason {
        background: #f5f3ff;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        border-left: 3px solid #8b5cf6;
    }
    
    .addendum-reason .label {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #7c3aed;
    }
    
    .addendum-reason p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-primary);
    }
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .confirm-modal {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }
    
    .confirm-icon {
        margin-bottom: 1rem;
    }
    
    .confirm-modal h3 {
        margin: 0 0 0.75rem;
        font-size: 1.25rem;
        color: #1e293b;
    }
    
    .confirm-modal p {
        margin: 0 0 1.5rem;
        color: #64748b;
        font-size: 0.9rem;
        line-height: 1.5;
    }
    
    .confirm-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }
    
    .btn-cancel {
        padding: 0.75rem 1.5rem;
        border: 1px solid #e2e8f0;
        background: white;
        color: #64748b;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .btn-cancel:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
    }
    
    .btn-confirm {
        padding: 0.75rem 1.5rem;
        border: none;
        background: #3b82f6;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .btn-confirm:hover {
        background: #2563eb;
    }
</style>
