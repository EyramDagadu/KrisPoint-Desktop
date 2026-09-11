<!-- src/routes/reports/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { formatModality, formatBodyPart } from '$lib/utils/formatters.js';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import { toastSuccess, toastError } from '$lib/utils/toast.js';
  import PDFPreviewModal from '$lib/components/reporting/PDFPreviewModal.svelte';
  import DateFilterDropdown from '$lib/components/DateFilterDropdown.svelte';
  import { reportData, patientData } from '$lib/stores/reportStore.js';
  
  let reports = [];
  let isLoading = true;
  let loadError = null;
  
  let searchQuery = '';
  let filteredReports = [];
  let selectedStatus = 'all';
  let selectedModality = 'all';
  let dateStartFilter = '';
  let dateEndFilter = '';
  let datePreset = 'all';
  let viewMode = 'card'; // 'card' or 'table'

  // Confirm dialog state
  let showDeleteConfirm = false;
  let reportToDelete = null;

  // PDF Preview Modal state
  let showPreviewModal = false;

  // Load saved reports on mount
  onMount(async () => {
    if (browser) {
      await loadReports();
    }
  });

  async function loadReports() {
    try {
      isLoading = true;
      loadError = null;
      
      const res = await fetch('/api/reports', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const result = await res.json();
      
      if (result.success) {
        reports = result.reports.map(report => ({
          id: report.id,
          patient: report.patient || 'Unknown Patient',
          hospitalNumber: report.hospitalNumber || '',
          studyDate: report.studyDate || '',
          modality: formatModality(report.modality) || 'Unknown',
          bodyPart: formatBodyPart(report.bodyPart) || formatModality(report.modality) || '',
          status: report.status,
          accessionNumber: report.accessionNumber || '',
          dateCreated: report.dateCreated,
          lastModified: report.lastModified,
          authors: report.authors || ['Unknown']
        }));
        console.log(`Loaded ${reports.length} reports from database`);
      } else {
        reports = [];
        loadError = result.error || 'Failed to load reports';
        console.error('Failed to load reports:', result.error);
      }
    } catch (error) {
      reports = [];
      loadError = 'Error loading reports';
      console.error('Error loading reports:', error);
    } finally {
      isLoading = false;
    }
  }

  function handleDateFilterChange(e) {
    dateStartFilter = e.detail.startDate;
    dateEndFilter = e.detail.endDate;
    datePreset = e.detail.preset;
  }
  
  // Filter reports based on search and filters
  $: {
    filteredReports = reports.filter(report => {
      const matchesSearch = !searchQuery || 
        report.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.bodyPart.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.modality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.hospitalNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
      const matchesModality = selectedModality === 'all' || report.modality === selectedModality;
      
      // Date range filter
      let matchesDate = true;
      if (dateStartFilter || dateEndFilter) {
        const reportDate = report.studyDate ? report.studyDate.split('T')[0] : '';
        if (dateStartFilter && dateEndFilter) {
          matchesDate = reportDate >= dateStartFilter && reportDate <= dateEndFilter;
        } else if (dateStartFilter) {
          matchesDate = reportDate >= dateStartFilter;
        } else if (dateEndFilter) {
          matchesDate = reportDate <= dateEndFilter;
        }
      }
      
      return matchesSearch && matchesStatus && matchesModality && matchesDate;
    });
  }
  
  function clearFilters() {
    searchQuery = '';
    dateStartFilter = '';
    dateEndFilter = '';
    datePreset = 'all';
    selectedStatus = 'all';
    selectedModality = 'all';
  }

  async function viewReport(reportId, event) {
    // Navigate to reporting page to view/edit the report (using database report ID)
    if (browser) {
      // Add loading state to report while navigating
      const reportCard = event?.target?.closest('.report-card');
      if (reportCard) {
        reportCard.style.opacity = '0.6';
        reportCard.style.pointerEvents = 'none';
        reportCard.style.cursor = 'wait';
      }
      
      try {
        // Use reportId parameter which loads from database
        await goto(`/reporting?reportId=${reportId}`);
      } catch (error) {
        console.error('Navigation failed:', error);
        // Restore card state on navigation failure
        if (reportCard) {
          reportCard.style.opacity = '1';
          reportCard.style.pointerEvents = 'auto';
          reportCard.style.cursor = 'pointer';
        }
      }
    }
  }

  async function createNewReport() {
    if (browser) {
      try {
        await goto('/reporting?new=true');
      } catch (error) {
        console.error('Navigation failed:', error);
        // Fallback to window.location as last resort
        window.location.href = '/reporting?new=true';
      }
    }
  }

  function deleteReport(report, event) {
    event.stopPropagation();
    reportToDelete = report;
    showDeleteConfirm = true;
  }

  async function confirmDeleteReport() {
    if (reportToDelete) {
      try {
        const res = await fetch(`/api/reports/${reportToDelete.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        const result = await res.json();
        
        if (result.success) {
          toastSuccess('Report deleted successfully');
          await loadReports();
        } else {
          toastError(result.error || 'Failed to delete report');
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        toastError('Error deleting report');
      }
      reportToDelete = null;
    }
  }

  async function exportReport(report, event) {
    event.stopPropagation();
    
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const result = await res.json();
      
      if (result.success && result.report) {
        const dbReport = result.report;
        
        // Use content field directly if available, otherwise build from structured fields
        let contentToUse = dbReport.content || '';
        if (!contentToUse) {
          const contentParts = [];
          if (dbReport.technique) contentParts.push(`TECHNIQUE:\n${dbReport.technique}`);
          if (dbReport.comparison) contentParts.push(`COMPARISON:\n${dbReport.comparison}`);
          if (dbReport.findings) contentParts.push(`FINDINGS:\n${dbReport.findings}`);
          if (dbReport.impressions) contentParts.push(`IMPRESSION:\n${dbReport.impressions}`);
          if (dbReport.recommendations) contentParts.push(`RECOMMENDATIONS:\n${dbReport.recommendations}`);
          contentToUse = contentParts.join('\n\n');
        }
        
        // Calculate age from date of birth if available
        let calculatedAge = '';
        const dob = dbReport.patientData?.dateOfBirth;
        if (dob) {
          const birthDate = new Date(dob);
          const today = new Date();
          const ageYears = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
          if (ageYears >= 1) {
            calculatedAge = String(ageYears);
          }
        }
        
        reportData.set({
          content: contentToUse,
          databaseReportId: dbReport.id,
          studyType: dbReport.modality || '',
          studySubtype: dbReport.bodyRegion || '',
          status: dbReport.status || 'DRAFT',
          // Workflow signature info for PDF export
          creatorInfo: dbReport.creatorInfo || null,
          signerInfo: dbReport.signerInfo || null,
          signedBy: dbReport.signedBy || null,
          signedAt: dbReport.signedAt || null
        });
        
        patientData.set({
          name: dbReport.patientData?.name || '',
          age: calculatedAge,
          ageUnit: 'years',
          dateOfBirth: dbReport.patientData?.dateOfBirth || '',
          gender: dbReport.patientData?.gender || '',
          examType: dbReport.patientData?.examType || dbReport.modality || '',
          examSubtype: dbReport.patientData?.examSubtype || dbReport.bodyRegion || '',
          indication: dbReport.patientData?.indication || '',
          referringPhysician: dbReport.patientData?.referringPhysician || '',
          studyDate: dbReport.patientData?.studyDate || '',
          accessionNumber: dbReport.accessionNumber || '',
          hospitalNumber: dbReport.patientData?.hospitalNumber || '',
          specialistName: '',
          specialistDesignation: 'Radiologist'
        });
        
        showPreviewModal = true;
      } else {
        toastError(result.error || 'Failed to load report for export');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toastError('Error loading report');
    }
  }

  function closePreviewModal() {
    showPreviewModal = false;
  }

  function handleExportSuccess(filename) {
    toastSuccess(`PDF exported successfully: ${filename}`);
  }

  function handleExportError(error) {
    toastError('Export failed. Please check your report data and try again.');
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function getStatusClass(status) {
    return status === 'Completed' ? 'status-completed' : 'status-draft';
  }
</script>

<svelte:head>
  <title>Reports - KrisPoint</title>
</svelte:head>

<div class="reports-page">
    <div class="filters-section">
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Search patient name, hospital no..." 
          bind:value={searchQuery}
          class="search-input"
        />
      </div>
      
      <div class="filters">
        <DateFilterDropdown 
          startDate={dateStartFilter}
          endDate={dateEndFilter}
          selectedPreset={datePreset}
          on:change={handleDateFilterChange}
        />
        
        <select bind:value={selectedStatus} class="filter-select">
          <option value="all">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Draft">Draft</option>
        </select>
        
        <select bind:value={selectedModality} class="filter-select">
          <option value="all">All Modalities</option>
          <option value="CT">CT</option>
          <option value="MRI">MRI</option>
          <option value="X-Ray">X-Ray</option>
          <option value="Ultrasound">Ultrasound</option>
          <option value="Mammography">Mammography</option>
          <option value="Fluoroscopy">Fluoroscopy</option>
          <option value="Nuclear Medicine">Nuclear Medicine</option>
        </select>
        
        {#if searchQuery || datePreset !== 'all' || selectedStatus !== 'all' || selectedModality !== 'all'}
          <button class="btn-clear" on:click={clearFilters} title="Clear all filters">
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
    </div>

    {#if viewMode === 'table'}
      <div class="table-container">
        {#if isLoading}
          <div class="loading-state">
            <div class="loading-icon">&#9203;</div>
            <h3>Loading reports...</h3>
          </div>
        {:else if loadError}
          <div class="error-state">
            <div class="error-icon">&#9888;</div>
            <h3>Error loading reports</h3>
            <p>{loadError}</p>
          </div>
        {:else if filteredReports.length === 0}
          <div class="empty-state">
            <div class="empty-icon">&#128196;</div>
            <h3>No reports found</h3>
          </div>
        {:else}
          <table class="data-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Patient</th>
                <th>Hospital No</th>
                <th>Study Date</th>
                <th>Modality</th>
                <th>Body Part</th>
                <th>Status</th>
                <th>Authors</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredReports as report}
                <tr>
                  <td class="report-id-cell">R-{report.id}</td>
                  <td>{report.patient}</td>
                  <td>{report.hospitalNumber || '-'}</td>
                  <td>{formatDate(report.studyDate)}</td>
                  <td>{report.modality}</td>
                  <td>{report.bodyPart}</td>
                  <td><span class="status-badge {getStatusClass(report.status)}">{report.status}</span></td>
                  <td>{report.authors?.join(', ') || '-'}</td>
                  <td>{formatDate(report.lastModified)}</td>
                  <td class="action-cell">
                    <button class="btn-action btn-view" on:click={(e) => viewReport(report.id, e)} title="View">&#128065;</button>
                    {#if report.status === 'SIGNED'}
                      <button class="btn-action btn-export" on:click={(e) => exportReport(report, e)} title="Export">&#128228;</button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    {:else}
    <div class="reports-grid">
      {#if isLoading}
        <div class="loading-state">
          <div class="loading-icon">⏳</div>
          <h3>Loading reports...</h3>
          <p>Please wait while we load your saved reports.</p>
        </div>
      {:else if loadError}
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Error loading reports</h3>
          <p>{loadError}</p>
          <button class="btn btn-primary" on:click={loadReports}>
            Try Again
          </button>
        </div>
      {:else}
        {#each filteredReports as report}
          <div class="report-card" on:click={(event) => viewReport(report.id, event)}>
            <div class="report-header">
              <div class="header-left">
                <span class="report-id-badge">R-{report.id}</span>
                <h3>{report.patient}</h3>
              </div>
              <span class="status {getStatusClass(report.status)}">{report.status}</span>
            </div>
            
            <div class="report-details">
              {#if report.hospitalNumber}
                <div class="detail-row">
                  <span class="label">Hospital No:</span>
                  <span class="value">{report.hospitalNumber}</span>
                </div>
              {/if}
              <div class="detail-row">
                <span class="label">Study Date:</span>
                <span class="value">{formatDate(report.studyDate)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Modality:</span>
                <span class="value">{report.modality}</span>
              </div>
              <div class="detail-row">
                <span class="label">Body Part:</span>
                <span class="value">{report.bodyPart}</span>
              </div>
              <div class="detail-row authors-row">
                <span class="label">Authors:</span>
                <div class="authors-list">
                  {#each report.authors as author}
                    <span class="author-name">{author}</span>
                  {/each}
                </div>
              </div>
              {#if report.reportDate}
                <div class="detail-row">
                  <span class="label">Report Date:</span>
                  <span class="value">{formatDate(report.reportDate)}</span>
                </div>
              {/if}
              <div class="detail-row">
                <span class="label">Last Modified:</span>
                <span class="value">{formatDate(report.lastModified)}</span>
              </div>
            </div>

            <div class="report-actions">
              <button 
                class="action-btn view-btn" 
                on:click={(event) => viewReport(report.id, event)}
                title="Open and edit report"
              >
                📖 View
              </button>
              {#if report.status === 'SIGNED'}
                <button 
                  class="action-btn export-btn" 
                  on:click={(event) => exportReport(report, event)}
                  title="Export to PDF"
                >
                  📤 Export
                </button>
              {/if}
            </div>
          </div>
        {/each}
        
        {#if filteredReports.length === 0 && reports.length > 0}
          <div class="no-reports">
            <div class="no-reports-icon">🔍</div>
            <h3>No reports match your filters</h3>
            <p>Try adjusting your search criteria to find reports.</p>
          </div>
        {:else if reports.length === 0}
          <div class="no-reports">
            <div class="no-reports-icon">📄</div>
            <h3>No reports yet</h3>
            <p>You haven't created any reports yet. Create your first report to get started.</p>
            <button class="btn btn-primary" on:click={createNewReport}>
              Create New Report
            </button>
          </div>
        {/if}
      {/if}
    </div>
    {/if}
  </div>

<ConfirmDialog
  bind:show={showDeleteConfirm}
  title="Delete Report?"
  message={reportToDelete ? `Are you sure you want to delete the report for ${reportToDelete.patient}? This action cannot be undone.` : 'Are you sure you want to delete this report?'}
  confirmText="Delete"
  cancelText="Cancel"
  danger={true}
  on:confirm={confirmDeleteReport}
/>

<PDFPreviewModal 
  isOpen={showPreviewModal} 
  onClose={closePreviewModal}
  onExportSuccess={handleExportSuccess}
  onExportError={handleExportError}
/>

<style>
  .reports-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 2rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: var(--color-primary, #3b82f6);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover, #2563eb);
    transform: translateY(-1px);
  }

  .filters-section {
    margin-bottom: 2rem;
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-bar {
    flex: 1;
    min-width: 300px;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1f2937);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .filters {
    display: flex;
    gap: 1rem;
  }

  .filter-select {
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1f2937);
    cursor: pointer;
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
  }

  .date-filter-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .date-filter {
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1f2937);
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
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .btn-clear {
    padding: 0.75rem 1rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-secondary, #6b7280);
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .btn-clear:hover {
    background: var(--color-border, #e5e7eb);
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
  
  .data-table tbody tr:hover {
    background: var(--color-bg-secondary, #f9fafb);
  }

  :global([data-theme="dark"]) .data-table tbody tr:hover {
    background: #334155;
  }
  
  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .status-badge.status-completed {
    background: #dcfce7;
    color: #166534;
  }
  
  .status-badge.status-draft {
    background: #fef9c3;
    color: #854d0e;
  }
  
  .action-cell {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-action {
    padding: 0.4rem 0.6rem;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    background: var(--color-bg-secondary, #f3f4f6);
    transition: all 0.2s ease;
  }

  :global([data-theme="dark"]) .btn-action {
    background: #334155;
  }
  
  .btn-view {
    color: var(--color-primary, #3b82f6);
  }
  
  .btn-view:hover {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
  }
  
  .btn-export {
    color: #059669;
  }
  
  .btn-export:hover {
    background: #10b981;
    color: white;
    border-color: #10b981;
  }
  
  .btn-delete {
    color: #dc2626;
  }
  
  .btn-delete:hover {
    background: #dc2626;
    color: white;
    border-color: #dc2626;
  }

  .reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .report-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .report-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary, #3b82f6);
  }

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .report-header h3 {
    margin: 0;
    color: var(--color-text-primary, #1f2937);
    font-size: 1.125rem;
    font-weight: 600;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .report-id-badge {
    background: #1e3a5f;
    color: #93c5fd;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .report-id-cell {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-weight: 600;
    color: #93c5fd;
  }

  .status {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .status-completed {
    background: var(--color-success-light, #dcfce7);
    color: var(--color-success, #16a34a);
  }

  .status-draft {
    background: var(--color-warning-light, #fef3c7);
    color: var(--color-warning, #d97706);
  }

  .report-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-row.authors-row {
    align-items: flex-start;
  }

  .authors-list {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
  }

  .author-name {
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 400;
  }

  .label {
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .value {
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 400;
  }

  .no-reports,
  .loading-state,
  .error-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
  }

  .no-reports-icon,
  .loading-icon,
  .error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .loading-icon {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .no-reports h3,
  .loading-state h3,
  .error-state h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
  }

  .no-reports p,
  .loading-state p,
  .error-state p {
    margin: 0 0 2rem 0;
    font-size: 1rem;
  }

  .error-state {
    color: var(--error);
  }

  .error-icon {
    opacity: 0.8;
  }

  .icon {
    font-size: 1rem;
  }

  .report-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .action-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 6px;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1f2937);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }

  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .view-btn:hover {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
  }

  .export-btn:hover {
    background: #10b981;
    color: white;
    border-color: #10b981;
  }

  .delete-btn {
    color: #dc2626;
    border-color: #fca5a5;
  }

  .delete-btn:hover {
    background: #dc2626;
    color: white;
    border-color: #dc2626;
  }

  @media (max-width: 768px) {
    .reports-page {
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .filters-section {
      flex-direction: column;
      align-items: stretch;
    }

    .filters {
      justify-content: center;
    }

    .reports-grid {
      grid-template-columns: 1fr;
    }
  }
</style>