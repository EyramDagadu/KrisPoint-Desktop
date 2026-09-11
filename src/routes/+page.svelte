<!-- src/routes/+page.svelte - Dashboard with Real Data -->
<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { formatModality } from '$lib/utils/formatters.js';
  import { permissions } from '$lib/stores/authStore.js';
  let recentReports = [];
  let isLoading = true;
  let error = null;
  
  // Role-based permissions
  $: canCreateReports = $permissions?.includes('reports.create');
  $: canViewTemplates = $permissions?.includes('templates.read');
  $: isFrontDeskOnly = !canCreateReports && !canViewTemplates;
  
  // Worklist stats for front desk
  let pendingStudies = 0;
  let inProgressStudies = 0;
  let completedToday = 0;
  
  // Statistics
  let totalReports = 0;
  let draftReports = 0;
  let reportsThisWeek = 0;
  
  function createNewReport() {
    // Navigate to reporting page with new report parameter
    goto('/reporting?new=true');
  }
  
  function continueReport(reportId) {
    // Navigate to reporting page to load existing report from server
    goto(`/reporting?reportId=${reportId}`);
  }
  
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
  }
  
  function formatReportStatus(status) {
    switch (status?.toLowerCase()) {
      case 'finalized':
        return 'Final';
      case 'draft':
        return 'Draft';
      default:
        return 'Pending Review';
    }
  }
  
  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }
  
  function getReportsThisWeek(reports) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return reports.filter(report => {
      try {
        const reportDate = new Date(report.dateCreated);
        return reportDate >= oneWeekAgo;
      } catch (error) {
        return false;
      }
    }).length;
  }
  
  async function loadReports() {
    if (!browser) return;
    
    try {
      isLoading = true;
      error = null;
      
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
        const allReports = result.reports || [];
        
        // Transform reports for dashboard display
        const transformedReports = allReports.map(report => ({
          id: report.id,
          patient: report.patient || 'Unknown Patient',
          study: formatModality(report.modality) || 'Unknown Study',
          date: formatDate(report.studyDate || report.dateCreated),
          status: report.status || 'Draft',
          rawDate: report.dateCreated,
          rawStatus: report.status
        }));
        
        // Take only the 5 most recent reports for dashboard
        recentReports = transformedReports.slice(0, 5);
        
        // Calculate statistics
        totalReports = allReports.length;
        draftReports = allReports.filter(report => 
          report.status === 'Draft'
        ).length;
        reportsThisWeek = getReportsThisWeek(allReports);
        
        console.log('Dashboard loaded reports:', {
          total: totalReports,
          drafts: draftReports,
          thisWeek: reportsThisWeek,
          recent: recentReports.length
        });
      } else {
        console.warn('Failed to load reports:', result.error);
        error = result.error || 'Failed to load reports';
        recentReports = [];
        totalReports = 0;
        draftReports = 0;
        reportsThisWeek = 0;
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      error = 'Unable to load reports: ' + err.message;
      recentReports = [];
      totalReports = 0;
      draftReports = 0;
      reportsThisWeek = 0;
    } finally {
      isLoading = false;
    }
  }
  
  async function loadWorklistStats() {
    if (!browser) return;
    
    try {
      const res = await fetch('/api/worklist', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.items) {
          const today = new Date().toDateString();
          pendingStudies = data.items.filter(i => i.status === 'PENDING').length;
          inProgressStudies = data.items.filter(i => i.status === 'IN_PROGRESS').length;
          completedToday = data.items.filter(i => 
            i.status === 'COMPLETED' && new Date(i.createdAt).toDateString() === today
          ).length;
        }
      }
    } catch (err) {
      console.error('Failed to load worklist stats:', err);
    }
  }
  
  onMount(() => {
    if (isFrontDeskOnly) {
      loadWorklistStats();
    } else {
      loadReports();
    }
  });
  
  $: if (browser && isFrontDeskOnly !== undefined) {
    if (isFrontDeskOnly) {
      loadWorklistStats();
    } else {
      loadReports();
    }
  }
</script>

<div class="dashboard">
    <div class="welcome-section">
      <h1>Welcome to KrisPoint</h1>
      {#if isFrontDeskOnly}
        <p>Patient registration and study management</p>
        
        <div class="quick-actions">
          <a href="/worklist" class="action-card primary">
            <div class="action-icon">📋</div>
            <div class="action-content">
              <h3>Worklist</h3>
              <p>Register patients and manage studies</p>
            </div>
          </a>
          
          <a href="/settings" class="action-card">
            <div class="action-icon">⚙️</div>
            <div class="action-content">
              <h3>Settings</h3>
              <p>Configure your preferences</p>
            </div>
          </a>
        </div>
      {:else}
        <p>AI-powered voice dictation for professional radiology reporting</p>
        
        <div class="quick-actions">
          <button class="action-card primary" on:click={createNewReport}>
            <div class="action-icon">📝</div>
            <div class="action-content">
              <h3>New Report</h3>
              <p>Start dictating a new radiology report</p>
            </div>
          </button>
          
          <a href="/reporting" class="action-card">
            <div class="action-icon">⚡</div>
            <div class="action-content">
              <h3>Continue Reporting</h3>
              <p>Resume your current report</p>
            </div>
          </a>
          
          {#if canViewTemplates}
          <a href="/templates" class="action-card">
            <div class="action-icon">📋</div>
            <div class="action-content">
              <h3>Templates</h3>
              <p>Manage report templates</p>
            </div>
          </a>
          {/if}
        </div>
      {/if}
    </div>
    
    {#if isFrontDeskOnly}
      <!-- Front Desk: Worklist Stats -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-number">{pendingStudies}</div>
          <div class="stat-label">Pending Studies</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{inProgressStudies}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{completedToday}</div>
          <div class="stat-label">Completed Today</div>
        </div>
      </div>
    {:else}
      <!-- Radiologists: Recent Reports -->
      <div class="recent-section">
        <div class="section-header">
          <h2>Recent Reports</h2>
          <a href="/reports" class="view-all-link">View all reports</a>
        </div>
        
        {#if isLoading}
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading reports...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <p>Error loading reports: {error}</p>
            <button class="retry-btn" on:click={loadReports}>Try Again</button>
          </div>
        {:else if recentReports.length === 0}
          <div class="empty-state">
            <div class="empty-icon">📄</div>
            <h3>No reports yet</h3>
            <p>Get started by creating your first radiology report</p>
            <button class="action-btn" on:click={createNewReport}>Create New Report</button>
          </div>
        {:else}
          <div class="reports-list">
            {#each recentReports as report}
              <div class="report-card" class:clickable={report.status === 'Draft'}>
                <div class="report-info">
                  <h4>{report.patient}</h4>
                  <p class="study-info">{report.study}</p>
                  <p class="date-info">{report.date}</p>
                </div>
                <div class="report-actions">
                  <div class="report-status">
                    <span class="status {report.status.toLowerCase().replace(' ', '-')}">{report.status}</span>
                  </div>
                  {#if report.status === 'Draft'}
                    <button 
                      class="continue-btn" 
                      on:click={() => continueReport(report.id)}
                      title="Continue this report"
                    >
                      Continue
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <!-- Quick Stats Section -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-number">{reportsThisWeek}</div>
          <div class="stat-label">Reports This Week</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{draftReports}</div>
          <div class="stat-label">Draft Reports</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{totalReports}</div>
          <div class="stat-label">Total Reports</div>
        </div>
      </div>
    {/if}
</div>

<style>
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
  }
  
  .welcome-section {
    margin-bottom: 3rem;
  }
  
  .welcome-section h1 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary);
    font-size: 2.25rem;
    font-weight: 700;
  }
  
  .welcome-section p {
    color: var(--color-text-secondary);
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }
  
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .action-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--color-surface);
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease-in-out;
    width: 100%;
    text-align: left;
  }
  
  .action-card:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  .action-card.primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
  }
  
  .action-card.primary:hover {
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }

  /* Visual hierarchy on blue background */
  .action-card.primary .action-content h3 {
    color: #ffffff;
    opacity: 1;
    font-weight: 700;
  }

  .action-card.primary .action-content p {
    color: rgba(255, 255, 255, 0.85);
    opacity: 1;
  }
  
  .action-icon {
    font-size: 2rem;
    opacity: 0.95;
    flex-shrink: 0;
  }
  
  .action-content h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .action-content p {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.95;
  }
  
  .recent-section {
    margin-bottom: 3rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .recent-section h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .view-all-link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .view-all-link:hover {
    color: #2563eb;
    text-decoration: underline;
  }
  
  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem;
    text-align: center;
  }
  
  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--color-border);
    border-top: 3px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-state p {
    color: var(--color-text-secondary);
    margin: 0;
  }
  
  /* Error State */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem;
    text-align: center;
    background: var(--color-surface);
    border-radius: 0.75rem;
    border: 1px solid var(--color-border);
  }
  
  .error-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.7;
  }
  
  .error-state p {
    color: var(--color-text-secondary);
    margin: 0 0 1.5rem 0;
  }
  
  .retry-btn {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: var(--color-text-primary-inverse);
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .retry-btn:hover {
    background: var(--color-primary-hover);
  }
  
  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem;
    text-align: center;
    background: var(--color-surface);
    border-radius: 0.75rem;
    border: 1px dashed var(--color-border);
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .empty-state p {
    color: var(--color-text-secondary);
    margin: 0 0 1.5rem 0;
  }
  
  .action-btn {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: var(--color-text-primary-inverse);
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .action-btn:hover {
    background: var(--color-primary-hover);
  }
  
  .reports-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .report-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background: var(--color-surface);
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease-in-out;
  }
  
  .report-card.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  
  .report-info h4 {
    margin: 0 0 0.25rem 0;
    color: var(--color-text-primary);
    font-weight: 600;
  }
  
  .study-info {
    margin: 0 0 0.25rem 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }
  
  .date-info {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }
  
  .report-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .status {
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
  
  .status.draft {
    background: var(--color-warning-light);
    color: var(--color-warning);
  }
  
  .status.final {
    background: var(--color-success-light);
    color: var(--color-success);
  }
  
  .status.pending-review {
    background: var(--color-warning-light);
    color: var(--color-warning);
  }
  
  .continue-btn {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: var(--color-text-primary-inverse);
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .continue-btn:hover {
    background: var(--color-primary-hover);
  }
  
  .stats-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  
  .stat-card {
    background: var(--color-surface);
    padding: 2rem;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  
  .stat-number {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }
    
    .welcome-section h1 {
      font-size: 2rem;
    }
    
    .quick-actions {
      grid-template-columns: 1fr;
    }
    
    .action-card {
      padding: 1rem;
    }
    
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .report-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .report-actions {
      align-self: stretch;
      justify-content: space-between;
    }
  }
</style>