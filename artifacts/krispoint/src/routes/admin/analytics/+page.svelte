<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { currentUser, permissions, authState } from '$lib/stores/authStore';
    
    let analytics: any = null;
    let loading = true;
    let error = '';
    let authChecked = false;
    
    let startDate = '';
    let endDate = '';
    let selectedModality = '';
    
    const modalities = ['CT', 'MRI', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy', 'Nuclear Medicine', 'PET-CT'];
    
    $: canViewAnalytics = $permissions.includes('analytics.view') || $permissions.includes('analytics.read');
    
    $: if (!$authState.isLoading && !authChecked) {
        authChecked = true;
        if (!$currentUser) {
            goto('/auth');
        } else if (!canViewAnalytics) {
            goto('/');
        } else {
            initializePage();
        }
    }
    
    function initializePage() {
        const now = new Date();
        endDate = now.toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
        loadAnalytics();
    }
    
    async function loadAnalytics() {
        loading = true;
        error = '';
        
        try {
            let url = `/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`;
            if (selectedModality) {
                url += `&modality=${selectedModality}`;
            }
            
            const res = await fetch(url, {
                credentials: 'include'
            });
            
            const data = await res.json();
            if (data.success) {
                analytics = data.analytics;
            } else {
                error = data.error;
            }
        } catch (err) {
            error = 'Failed to load analytics';
        } finally {
            loading = false;
        }
    }
    
    function formatDuration(ms: number) {
        if (!ms || ms === 0) return '-';
        const minutes = Math.floor(ms / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        if (minutes > 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
        return `${minutes}m ${seconds}s`;
    }
    
    function getStatusColor(status: string) {
        switch (status) {
            case 'DRAFT': return '#6b7280';
            case 'SUBMITTED': return '#d97706';
            case 'SIGNED': return '#16a34a';
            default: return '#6b7280';
        }
    }
</script>

{#if $authState.isLoading || !authChecked}
    <div class="auth-loading">
        <p>Loading...</p>
    </div>
{:else if $currentUser && canViewAnalytics}
<div class="analytics-page">
    <div class="page-header">
        <h1>Reporting Analytics</h1>
        <p class="subtitle">Measure reporting efficiency and track performance trends</p>
    </div>
    
    <div class="filters">
        <div class="filter-group">
            <label for="startDate">Start Date</label>
            <input type="date" id="startDate" bind:value={startDate} on:change={loadAnalytics} />
        </div>
        <div class="filter-group">
            <label for="endDate">End Date</label>
            <input type="date" id="endDate" bind:value={endDate} on:change={loadAnalytics} />
        </div>
        <div class="filter-group">
            <label for="modality">Modality</label>
            <select id="modality" bind:value={selectedModality} on:change={loadAnalytics}>
                <option value="">All Modalities</option>
                {#each modalities as mod}
                    <option value={mod}>{mod}</option>
                {/each}
            </select>
        </div>
    </div>
    
    {#if error}
        <div class="error-message">{error}</div>
    {/if}
    
    {#if loading}
        <div class="loading">Loading analytics...</div>
    {:else if analytics}
        <div class="summary-cards">
            <div class="summary-card">
                <h3>Total Reports</h3>
                <div class="value">{analytics.summary.totalReports}</div>
            </div>
            <div class="summary-card">
                <h3>Avg. Reporting Time</h3>
                <div class="value">{formatDuration(analytics.summary.avgReportingTimeMs)}</div>
            </div>
            <div class="summary-card">
                <h3>Avg. Review Time</h3>
                <div class="value">{formatDuration(analytics.summary.avgReviewTimeMs)}</div>
            </div>
        </div>
        
        <div class="charts-grid">
            <div class="chart-card">
                <h3>Reports by Status</h3>
                <div class="status-bars">
                    {#each analytics.reportsByStatus as status}
                        <div class="status-row">
                            <span class="status-label">{status.status}</span>
                            <div class="bar-container">
                                <div 
                                    class="bar" 
                                    style="width: {(status.count / analytics.summary.totalReports) * 100}%; background: {getStatusColor(status.status)}"
                                ></div>
                            </div>
                            <span class="status-count">{status.count}</span>
                        </div>
                    {/each}
                </div>
            </div>
            
            <div class="chart-card">
                <h3>Reports by Modality</h3>
                <div class="modality-list">
                    {#each analytics.reportsByModality as mod}
                        <div class="modality-row">
                            <span class="modality-name">{mod.modality}</span>
                            <span class="modality-count">{mod.count} reports</span>
                            <span class="modality-time">Avg: {formatDuration(mod.avgReportingTimeMs)}</span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
        
        <div class="chart-card full-width">
            <h3>Performance by User</h3>
            <table class="user-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Reports</th>
                        <th>Avg. Reporting Time</th>
                    </tr>
                </thead>
                <tbody>
                    {#each analytics.reportsByUser as user}
                        <tr>
                            <td>{user.userName}</td>
                            <td>{user.userRole}</td>
                            <td>{user.count}</td>
                            <td>{formatDuration(user.avgReportingTimeMs)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        
        {#if analytics.reviewMetrics && analytics.reviewMetrics.length > 0}
            <div class="chart-card full-width">
                <h3>Review Performance by Specialist</h3>
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Reviewer</th>
                            <th>Reviews Completed</th>
                            <th>Avg. Review Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each analytics.reviewMetrics as reviewer}
                            <tr>
                                <td>{reviewer.reviewerName}</td>
                                <td>{reviewer.count}</td>
                                <td>{formatDuration(reviewer.avgReviewTimeMs)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
        
        {#if analytics.dailyTrend && analytics.dailyTrend.length > 0}
            <div class="chart-card full-width">
                <h3>Daily Report Volume</h3>
                <div class="trend-chart">
                    {#each analytics.dailyTrend as day}
                        <div class="trend-bar">
                            <div 
                                class="trend-fill" 
                                style="height: {Math.min((day.count / Math.max(...analytics.dailyTrend.map((d: any) => d.count))) * 100, 100)}%"
                            ></div>
                            <span class="trend-count">{day.count}</span>
                            <span class="trend-date">{new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/if}
</div>
{/if}

<style>
    .auth-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        color: var(--text-secondary);
    }
    .analytics-page {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
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
    
    .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }
    
    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .filter-group label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .filter-group input,
    .filter-group select {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--bg-secondary);
        color: var(--text-primary);
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
    
    .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .summary-card {
        background: var(--bg-primary);
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .summary-card h3 {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-transform: uppercase;
    }
    
    .summary-card .value {
        font-size: 2rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-top: 0.5rem;
    }
    
    .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }
    
    .chart-card {
        background: var(--bg-primary);
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .chart-card.full-width {
        margin-bottom: 1.5rem;
    }
    
    .chart-card h3 {
        margin: 0 0 1rem;
        font-size: 1rem;
        color: var(--text-primary);
    }
    
    .status-bars {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .status-row {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .status-label {
        width: 80px;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .bar-container {
        flex: 1;
        height: 24px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
    }
    
    .bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
    }
    
    .status-count {
        width: 40px;
        text-align: right;
        font-weight: 600;
    }
    
    .modality-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .modality-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .modality-name {
        font-weight: 500;
    }
    
    .modality-count, .modality-time {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    
    .user-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .user-table th,
    .user-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }
    
    .user-table th {
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 0.875rem;
    }
    
    .trend-chart {
        display: flex;
        gap: 0.25rem;
        height: 150px;
        align-items: flex-end;
        overflow-x: auto;
        padding-bottom: 2rem;
    }
    
    .trend-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 40px;
        flex: 1;
    }
    
    .trend-fill {
        width: 100%;
        background: var(--primary-color);
        border-radius: 4px 4px 0 0;
        min-height: 4px;
        transition: height 0.3s ease;
    }
    
    .trend-count {
        font-size: 0.75rem;
        font-weight: 600;
        margin-top: 0.25rem;
    }
    
    .trend-date {
        font-size: 0.625rem;
        color: var(--text-secondary);
        position: absolute;
        bottom: 0;
        transform: rotate(-45deg);
        white-space: nowrap;
    }
</style>
