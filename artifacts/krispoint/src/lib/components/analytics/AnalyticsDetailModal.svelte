<script lang="ts">
  import { browser } from '$app/environment';
  
  export let isOpen = false;
  export let onClose = () => {};
  export let title = 'Report Details';
  export let period = 'month';
  export let customStartDate = '';
  export let customEndDate = '';
  export let filterModality: string | null = null;
  export let sortBy: 'date' | 'duration' = 'date';
  export let sortOrder: 'asc' | 'desc' = 'desc';
  export let filterType: 'created' | 'reviewed' = 'created';
  
  let loading = false;
  let error = '';
  let reports: any[] = [];
  let currentSortBy = sortBy;
  let currentSortOrder = sortOrder;
  
  function getFetchOptions(): RequestInit {
    return { credentials: 'include' };
  }
  
  $: if (isOpen) {
    currentSortBy = sortBy;
    currentSortOrder = sortOrder;
    loadDetails();
  }
  
  async function loadDetails() {
    loading = true;
    error = '';
    
    try {
      let url = `/api/analytics/user/details?period=${period}&sortBy=${currentSortBy}&sortOrder=${currentSortOrder}&filterType=${filterType}`;
      
      if (period === 'custom' && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      
      if (filterModality) {
        url += `&modality=${encodeURIComponent(filterModality)}`;
      }
      
      const response = await fetch(url, getFetchOptions());
      const result = await response.json();
      
      if (result.success) {
        reports = result.data.reports;
      } else {
        error = result.error || 'Failed to load details';
      }
    } catch (err) {
      error = 'Failed to load report details';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  function handleSort(column: 'date' | 'duration') {
    if (currentSortBy === column) {
      currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      currentSortBy = column;
      currentSortOrder = 'desc';
    }
    loadDetails();
  }
  
  function formatDuration(ms: number): string {
    if (!ms || ms === 0) return '-';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }
  
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
  
  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }
  
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }
  
  function handleClose() {
    reports = [];
    error = '';
    onClose();
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick} role="presentation">
    <div class="modal-container">
      <div class="modal-header">
        <h2>{title}</h2>
        <button class="close-btn" on:click={handleClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-content">
        {#if loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading reports...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <p>{error}</p>
            <button on:click={loadDetails} class="btn-retry">Retry</button>
          </div>
        {:else if reports.length === 0}
          <div class="empty-state">
            <p>No reports found for this filter</p>
          </div>
        {:else}
          <div class="reports-summary">
            <span class="report-count">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
            {#if filterModality}
              <span class="filter-tag">{filterModality}</span>
            {/if}
          </div>
          
          <div class="reports-table-container">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Modality</th>
                  <th class="sortable" on:click={() => handleSort('date')}>
                    Date
                    {#if currentSortBy === 'date'}
                      <span class="sort-indicator">{currentSortOrder === 'desc' ? '↓' : '↑'}</span>
                    {/if}
                  </th>
                  <th>Status</th>
                  <th class="sortable" on:click={() => handleSort('duration')}>
                    Duration
                    {#if currentSortBy === 'duration'}
                      <span class="sort-indicator">{currentSortOrder === 'desc' ? '↓' : '↑'}</span>
                    {/if}
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each reports as report}
                  <tr>
                    <td>
                      <div class="patient-info">
                        <span class="patient-name">{report.patientName || 'Unknown'}</span>
                        {#if report.patientMrn}
                          <span class="patient-mrn">{report.patientMrn}</span>
                        {/if}
                      </div>
                    </td>
                    <td><span class="modality-badge">{report.modality}</span></td>
                    <td>
                      <span class="date-value" title={formatDateTime(report.createdAt)}>
                        {formatDate(report.createdAt)}
                      </span>
                    </td>
                    <td><span class="status-badge {report.status.toLowerCase()}">{report.status}</span></td>
                    <td>
                      <span class="duration-value" class:fast={report.reportingDurationMs < 300000} class:slow={report.reportingDurationMs > 1800000}>
                        {formatDuration(report.reportingDurationMs)}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
      
      <div class="modal-footer">
        <button class="btn-close" on:click={handleClose}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-container {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 900px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #1e293b;
  }
  
  .close-btn {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: #64748b;
    border-radius: 6px;
    transition: all 0.2s;
  }
  
  .close-btn:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
  
  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background: #ffffff;
  }
  
  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    color: #64748b;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .btn-retry {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  
  .reports-summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .report-count {
    font-weight: 600;
    color: #1e293b;
  }
  
  .filter-tag {
    background: #3b82f6;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .reports-table-container {
    overflow-x: auto;
  }
  
  .reports-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  
  .reports-table th,
  .reports-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .reports-table th {
    background: #f1f5f9;
    font-weight: 600;
    color: #475569;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  
  .reports-table th.sortable {
    cursor: pointer;
    user-select: none;
  }
  
  .reports-table th.sortable:hover {
    background: #e2e8f0;
  }
  
  .sort-indicator {
    margin-left: 0.25rem;
  }
  
  .reports-table tbody tr:hover {
    background: #f8fafc;
  }
  
  .patient-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  
  .patient-name {
    font-weight: 500;
    color: #1e293b;
  }
  
  .patient-mrn {
    font-size: 0.75rem;
    color: #64748b;
  }
  
  .modality-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #e2e8f0;
    color: #475569;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-badge.signed {
    background: #dcfce7;
    color: #166534;
  }
  
  .status-badge.submitted {
    background: #fef3c7;
    color: #92400e;
  }
  
  .status-badge.draft {
    background: #e2e8f0;
    color: #475569;
  }
  
  .date-value {
    color: #64748b;
  }
  
  .duration-value {
    font-weight: 500;
    color: #1e293b;
  }
  
  .duration-value.fast {
    color: #16a34a;
  }
  
  .duration-value.slow {
    color: #dc2626;
  }
  
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    background: #f8fafc;
  }
  
  .btn-close {
    padding: 0.6rem 1.5rem;
    background: #e2e8f0;
    color: #1e293b;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .btn-close:hover {
    background: #cbd5e1;
  }

  /* Dark theme overrides */
  :global([data-theme="dark"]) .modal-backdrop {
    background: rgba(0, 0, 0, 0.6);
  }

  :global([data-theme="dark"]) .modal-container {
    background: #0f172a;
    border-color: #334155;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }

  :global([data-theme="dark"]) .modal-header {
    background: #1e293b;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .modal-header h2 {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .close-btn {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .close-btn:hover {
    background: #334155;
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .modal-content {
    background: #0f172a;
  }

  :global([data-theme="dark"]) .loading-state,
  :global([data-theme="dark"]) .error-state,
  :global([data-theme="dark"]) .empty-state {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .spinner {
    border-color: #334155;
    border-top-color: #3b82f6;
  }

  :global([data-theme="dark"]) .reports-summary {
    border-color: #334155;
  }

  :global([data-theme="dark"]) .report-count {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .reports-table th,
  :global([data-theme="dark"]) .reports-table td {
    border-color: #334155;
  }

  :global([data-theme="dark"]) .reports-table th {
    background: #1e293b;
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .reports-table th.sortable:hover {
    background: #334155;
  }

  :global([data-theme="dark"]) .reports-table tbody tr:hover {
    background: #1e293b;
  }

  :global([data-theme="dark"]) .patient-name {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .patient-mrn {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .modality-badge {
    background: #334155;
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .date-value {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .duration-value {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .modal-footer {
    background: #1e293b;
    border-color: #334155;
  }

  :global([data-theme="dark"]) .btn-close {
    background: #334155;
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .btn-close:hover {
    background: #475569;
  }
</style>
