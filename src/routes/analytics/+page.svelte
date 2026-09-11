<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import AnalyticsDetailModal from '$lib/components/analytics/AnalyticsDetailModal.svelte';
  import DateFilterDropdown from '$lib/components/DateFilterDropdown.svelte';
  import * as XLSX from 'xlsx';

  export let data;
  
  let isExporting = false;

  $: userAnalytics = data.userAnalytics;
  $: adminAnalytics = data.adminAnalytics;
  $: isAdmin = data.isAdmin;
  $: filters = data.filters;

  let activeTab: 'my' | 'organization' = 'my';
  let localUserId = data.filters.userId;
  let localModality = data.filters.modality;
  let localStatus = data.filters.status;
  let lastSyncedFilters = JSON.stringify(data.filters);

  $: {
    const currentFilters = JSON.stringify(filters);
    if (currentFilters !== lastSyncedFilters) {
      localUserId = filters.userId;
      localModality = filters.modality;
      localStatus = filters.status;
      lastSyncedFilters = currentFilters;
    }
  }

  let detailModalOpen = false;
  let detailModalTitle = '';
  let detailModalModality: string | null = null;
  let detailModalSortBy: 'date' | 'duration' = 'date';
  let detailModalSortOrder: 'asc' | 'desc' = 'desc';
  let detailModalFilterType: 'created' | 'reviewed' = 'created';

  function buildDateUrl(startDate: string, endDate: string, preset: string): string {
    const searchParams = new URLSearchParams($page.url.search);
    if (preset === 'all') {
      searchParams.delete('startDate');
      searchParams.delete('endDate');
      searchParams.set('preset', 'all');
    } else {
      searchParams.set('startDate', startDate);
      searchParams.set('endDate', endDate);
      searchParams.set('preset', preset);
    }
    const queryString = searchParams.toString();
    return queryString ? `/analytics?${queryString}` : '/analytics';
  }

  function buildFilterUrl(userId: string, modality: string, status: string): string {
    const searchParams = new URLSearchParams($page.url.search);
    if (userId === 'all') searchParams.delete('userId');
    else searchParams.set('userId', userId);
    if (modality === 'all') searchParams.delete('modality');
    else searchParams.set('modality', modality);
    if (status === 'all') searchParams.delete('status');
    else searchParams.set('status', status);
    const queryString = searchParams.toString();
    return queryString ? `/analytics?${queryString}` : '/analytics';
  }

  function handleDateFilterChange(e: CustomEvent) {
    const { startDate, endDate, preset } = e.detail;
    const url = buildDateUrl(startDate, endDate, preset);
    goto(url, { replaceState: true, invalidateAll: true });
  }

  function applyFilters() {
    const url = buildFilterUrl(localUserId, localModality, localStatus);
    goto(url, { replaceState: true, invalidateAll: true });
  }

  function resetFilters() {
    const url = buildFilterUrl('all', 'all', 'all');
    goto(url, { replaceState: true, invalidateAll: true });
  }

  function openModalityDetail(modality: string) {
    detailModalTitle = `Reports: ${modality}`;
    detailModalModality = modality;
    detailModalSortBy = 'date';
    detailModalSortOrder = 'desc';
    detailModalFilterType = 'created';
    detailModalOpen = true;
  }

  function openReviewModalityDetail(modality: string) {
    detailModalTitle = `Reviews: ${modality}`;
    detailModalModality = modality;
    detailModalSortBy = 'date';
    detailModalSortOrder = 'desc';
    detailModalFilterType = 'reviewed';
    detailModalOpen = true;
  }

  function openTimingDetail(type: 'fastest' | 'slowest' | 'all') {
    if (type === 'fastest') {
      detailModalTitle = 'Fastest Reports';
      detailModalSortBy = 'duration';
      detailModalSortOrder = 'asc';
    } else if (type === 'slowest') {
      detailModalTitle = 'Slowest Reports';
      detailModalSortBy = 'duration';
      detailModalSortOrder = 'desc';
    } else {
      detailModalTitle = 'All Reports by Duration';
      detailModalSortBy = 'duration';
      detailModalSortOrder = 'asc';
    }
    detailModalModality = null;
    detailModalFilterType = 'created';
    detailModalOpen = true;
  }

  function openAllReports() {
    detailModalTitle = 'All Reports';
    detailModalModality = null;
    detailModalSortBy = 'date';
    detailModalSortOrder = 'desc';
    detailModalFilterType = 'created';
    detailModalOpen = true;
  }

  function closeDetailModal() {
    detailModalOpen = false;
    detailModalModality = null;
    detailModalFilterType = 'created';
  }

  async function exportToExcel() {
    isExporting = true;
    
    try {
      const workbook = XLSX.utils.book_new();
      const dateRange = filters.startDate && filters.endDate 
        ? `${filters.startDate} to ${filters.endDate}` 
        : 'All Time';
      
      if (activeTab === 'my' && userAnalytics) {
        // Summary sheet
        const summaryData = [
          ['KrisPoint Analytics Export - My Performance'],
          ['Date Range:', dateRange],
          ['Generated:', new Date().toLocaleString()],
          [''],
          ['Summary Metrics'],
          ['Total Reports', userAnalytics.summary.totalReports],
          ['Signed Reports', userAnalytics.summary.signedReports],
          ['Pending Review', userAnalytics.summary.submittedReports],
          ['Drafts', userAnalytics.summary.draftReports],
          ['Completion Rate', `${userAnalytics.summary.completionRate}%`],
          [''],
          ['Timing Metrics'],
          ['Average Reporting Time', formatDuration(userAnalytics.timing.avgReportingTimeMs)],
          ['Fastest Report', formatDuration(userAnalytics.timing.minReportingTimeMs)],
          ['Slowest Report', formatDuration(userAnalytics.timing.maxReportingTimeMs)],
          ['Total Time Spent', formatDuration(userAnalytics.timing.totalReportingTimeMs)],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        
        // Reports by Modality sheet
        if (userAnalytics.byModality.length > 0) {
          const modalityData = [
            ['Modality', 'Report Count'],
            ...userAnalytics.byModality.map((m: any) => [m.modality, m.count])
          ];
          const modalitySheet = XLSX.utils.aoa_to_sheet(modalityData);
          XLSX.utils.book_append_sheet(workbook, modalitySheet, 'By Modality');
        }
        
        // Recent Activity sheet
        if (userAnalytics.recentActivity.length > 0) {
          const activityData = [
            ['Date', 'Modality', 'Status', 'Time Taken'],
            ...userAnalytics.recentActivity.map((r: any) => [
              new Date(r.createdAt).toLocaleDateString(),
              r.modality,
              r.status,
              formatDuration(r.reportingDurationMs)
            ])
          ];
          const activitySheet = XLSX.utils.aoa_to_sheet(activityData);
          XLSX.utils.book_append_sheet(workbook, activitySheet, 'Recent Activity');
        }
        
        // Review Analytics sheet (for specialists)
        if (userAnalytics.reviews && userAnalytics.reviews.totalReviews > 0) {
          const reviewSummaryData = [
            ['Review Activity (As Specialist)'],
            [''],
            ['Summary'],
            ['Total Reports Reviewed', userAnalytics.reviews.totalReviews],
            ['Average Review Time', formatDuration(userAnalytics.reviews.timing.avgReviewTimeMs)],
            ['Fastest Review', formatDuration(userAnalytics.reviews.timing.minReviewTimeMs)],
            ['Slowest Review', formatDuration(userAnalytics.reviews.timing.maxReviewTimeMs)],
            ['Total Review Time', formatDuration(userAnalytics.reviews.timing.totalReviewTimeMs)],
            [''],
            ['Reviews by Modality'],
            ['Modality', 'Count'],
            ...userAnalytics.reviews.byModality.map((m: any) => [m.modality, m.count])
          ];
          const reviewSheet = XLSX.utils.aoa_to_sheet(reviewSummaryData);
          XLSX.utils.book_append_sheet(workbook, reviewSheet, 'Review Activity');
          
          // Recent Reviews sheet
          if (userAnalytics.reviews.recentActivity.length > 0) {
            const recentReviewsData = [
              ['Date', 'Modality', 'Review Time'],
              ...userAnalytics.reviews.recentActivity.map((r: any) => [
                new Date(r.createdAt).toLocaleDateString(),
                r.modality,
                formatDuration(r.reviewDurationMs)
              ])
            ];
            const recentReviewsSheet = XLSX.utils.aoa_to_sheet(recentReviewsData);
            XLSX.utils.book_append_sheet(workbook, recentReviewsSheet, 'Recent Reviews');
          }
        }
        
      } else if (activeTab === 'organization' && adminAnalytics) {
        // Organization Summary sheet
        const summaryData = [
          ['KrisPoint Analytics Export - Organization Overview'],
          ['Date Range:', dateRange],
          ['Generated:', new Date().toLocaleString()],
          [''],
          ['Summary Metrics'],
          ['Total Reports', adminAnalytics.summary.totalReports],
          ['Signed Reports', adminAnalytics.summary.signedReports],
          ['Pending Review', adminAnalytics.summary.submittedReports],
          ['Completion Rate', `${adminAnalytics.summary.completionRate}%`],
          [''],
          ['Productivity Metrics'],
          ['Reports Per Day', adminAnalytics.productivity.reportsPerDay],
          ['Reports Per Week', adminAnalytics.productivity.reportsPerWeek],
          ['Average Time Per Report', formatDuration(adminAnalytics.productivity.avgReportingTimeMs)],
          ['Fastest Report', formatDuration(adminAnalytics.productivity.minReportingTimeMs)],
          ['Total Time Invested', formatDuration(adminAnalytics.productivity.totalTimeSpentMs)],
          ['Active Days', adminAnalytics.productivity.activeDays],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        
        // Top Reporters sheet
        if (adminAnalytics.byUser.length > 0) {
          const userData = [
            ['Rank', 'User', 'Report Count'],
            ...adminAnalytics.byUser.map((u: any, i: number) => [i + 1, u.userName, u.count])
          ];
          const userSheet = XLSX.utils.aoa_to_sheet(userData);
          XLSX.utils.book_append_sheet(workbook, userSheet, 'Top Reporters');
        }
        
        // Reports by Modality sheet
        if (adminAnalytics.byModality.length > 0) {
          const modalityData = [
            ['Modality', 'Report Count'],
            ...adminAnalytics.byModality.map((m: any) => [m.modality, m.count])
          ];
          const modalitySheet = XLSX.utils.aoa_to_sheet(modalityData);
          XLSX.utils.book_append_sheet(workbook, modalitySheet, 'By Modality');
        }
        
        // User Performance sheet
        if (adminAnalytics.userPerformance.length > 0) {
          const perfData = [
            ['User', 'Reports', 'Avg Time', 'Fastest', 'Total Time'],
            ...adminAnalytics.userPerformance.map((u: any) => [
              u.userName,
              u.reportCount,
              formatDuration(u.avgTimeMs),
              formatDuration(u.minTimeMs),
              formatDuration(u.totalTimeMs)
            ])
          ];
          const perfSheet = XLSX.utils.aoa_to_sheet(perfData);
          XLSX.utils.book_append_sheet(workbook, perfSheet, 'User Performance');
        }
        
        // Weekly Trend sheet
        if (adminAnalytics.weeklyTrend && adminAnalytics.weeklyTrend.length > 0) {
          const trendData = [
            ['Week', 'Report Count'],
            ...adminAnalytics.weeklyTrend.map((w: any) => [w.week, w.count])
          ];
          const trendSheet = XLSX.utils.aoa_to_sheet(trendData);
          XLSX.utils.book_append_sheet(workbook, trendSheet, 'Weekly Trend');
        }
      }
      
      // Generate filename with date
      const today = new Date().toISOString().split('T')[0];
      const tabName = activeTab === 'my' ? 'MyAnalytics' : 'OrgAnalytics';
      const filename = `KrisPoint_${tabName}_${today}.xlsx`;
      
      // Download the file
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export analytics. Please try again.');
    } finally {
      isExporting = false;
    }
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

  $: maxWeeklyCount = (() => {
    if (adminAnalytics?.weeklyTrend && Array.isArray(adminAnalytics.weeklyTrend) && adminAnalytics.weeklyTrend.length > 0) {
      const counts = adminAnalytics.weeklyTrend.map((w: {count: number}) => w.count || 0);
      return counts.length > 0 ? Math.max(...counts, 1) : 1;
    }
    return 1;
  })();
</script>

<svelte:head>
  <title>Analytics - KrisPoint</title>
</svelte:head>

<div class="analytics-page">
  <div class="analytics-header">
    <div class="header-left">
      <h1>{activeTab === 'my' ? 'My Analytics' : 'Organization Analytics'}</h1>
      <p class="subtitle">
        {activeTab === 'my' 
          ? 'Track your reporting performance and productivity' 
          : 'View organization-wide performance metrics and productivity insights'}
      </p>
    </div>
    
    <div class="header-controls">
      <DateFilterDropdown 
        startDate={filters.startDate}
        endDate={filters.endDate}
        selectedPreset={filters.preset}
        on:change={handleDateFilterChange}
      />
      <button 
        class="btn-export-excel" 
        on:click={exportToExcel}
        disabled={isExporting}
        title="Export current view to Excel"
      >
        {#if isExporting}
          Exporting...
        {:else}
          Export Excel
        {/if}
      </button>
    </div>
  </div>
  
  {#if isAdmin}
  <div class="tab-switcher">
    <button 
      class="tab-btn" 
      class:active={activeTab === 'my'}
      on:click={() => activeTab = 'my'}
    >
      My Performance
    </button>
    <button 
      class="tab-btn" 
      class:active={activeTab === 'organization'}
      on:click={() => activeTab = 'organization'}
    >
      Organization Overview
    </button>
  </div>
  {/if}
  
  {#if !userAnalytics && !adminAnalytics}
    <div class="error-state">
      <p>Failed to load analytics data</p>
      <button on:click={() => invalidateAll()} class="btn-retry">Retry</button>
    </div>
  {:else if activeTab === 'my' && userAnalytics}
    <div class="analytics-grid">
      <div class="stat-card primary">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{userAnalytics.summary.totalReports}</div>
          <div class="stat-label">Total Reports</div>
        </div>
      </div>
      
      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{userAnalytics.summary.signedReports}</div>
          <div class="stat-label">Signed Reports</div>
        </div>
      </div>
      
      <div class="stat-card warning">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{userAnalytics.summary.submittedReports}</div>
          <div class="stat-label">Pending Review</div>
        </div>
      </div>
      
      <div class="stat-card info">
        <div class="stat-icon">📄</div>
        <div class="stat-content">
          <div class="stat-value">{userAnalytics.summary.draftReports}</div>
          <div class="stat-label">Drafts</div>
        </div>
      </div>
      
      <div class="stat-card accent">
        <div class="stat-icon">⏱️</div>
        <div class="stat-content">
          <div class="stat-value">{formatDuration(userAnalytics.timing.avgReportingTimeMs)}</div>
          <div class="stat-label">Avg. Reporting Time</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-value">{userAnalytics.summary.completionRate}%</div>
          <div class="stat-label">Completion Rate</div>
        </div>
      </div>
    </div>
    
    <div class="analytics-sections">
      <div class="section-row">
        <div class="section-card">
          <h3>Reports by Modality</h3>
          {#if userAnalytics.byModality.length > 0}
            <div class="modality-list">
              {#each userAnalytics.byModality as item}
                <button 
                  class="modality-item clickable" 
                  on:click={() => openModalityDetail(item.modality)}
                  title="Click to see all {item.modality} reports"
                >
                  <span class="modality-name">{item.modality}</span>
                  <div class="modality-bar-container">
                    <div 
                      class="modality-bar" 
                      style="width: {(item.count / userAnalytics.summary.totalReports) * 100}%"
                    ></div>
                  </div>
                  <span class="modality-count">{item.count}</span>
                </button>
              {/each}
            </div>
          {:else}
            <p class="empty-message">No reports yet in this period</p>
          {/if}
        </div>
        
        <div class="section-card">
          <h3>Timing Breakdown</h3>
          <div class="timing-grid">
            <button 
              class="timing-item clickable" 
              on:click={() => openTimingDetail('fastest')}
              title="Click to see fastest reports"
            >
              <div class="timing-label">Fastest Report</div>
              <div class="timing-value">{formatDuration(userAnalytics.timing.minReportingTimeMs)}</div>
            </button>
            <button 
              class="timing-item clickable" 
              on:click={() => openTimingDetail('slowest')}
              title="Click to see slowest reports"
            >
              <div class="timing-label">Slowest Report</div>
              <div class="timing-value">{formatDuration(userAnalytics.timing.maxReportingTimeMs)}</div>
            </button>
            <button 
              class="timing-item clickable" 
              on:click={() => openTimingDetail('all')}
              title="Click to see all reports by time"
            >
              <div class="timing-label">Average Time</div>
              <div class="timing-value">{formatDuration(userAnalytics.timing.avgReportingTimeMs)}</div>
            </button>
            <button 
              class="timing-item clickable" 
              on:click={() => openAllReports()}
              title="Click to see all reports"
            >
              <div class="timing-label">Total Time Spent</div>
              <div class="timing-value">{formatDuration(userAnalytics.timing.totalReportingTimeMs)}</div>
            </button>
          </div>
        </div>
      </div>
      
      <div class="section-card full-width">
        <h3>Recent Activity</h3>
        {#if userAnalytics.recentActivity.length > 0}
          <div class="activity-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Modality</th>
                  <th>Status</th>
                  <th>Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {#each userAnalytics.recentActivity as report}
                  <tr>
                    <td>{formatDate(report.createdAt)}</td>
                    <td><span class="modality-badge">{report.modality}</span></td>
                    <td><span class="status-badge {report.status.toLowerCase()}">{report.status}</span></td>
                    <td>{formatDuration(report.reportingDurationMs)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="empty-message">No recent activity</p>
        {/if}
      </div>
      
      {#if userAnalytics.reviews && userAnalytics.reviews.totalReviews > 0}
      <div class="section-divider">
        <h2 class="reviews-header">Review Activity (As Specialist)</h2>
        <p class="reviews-subtitle">Reports you reviewed for other users</p>
      </div>
      
      <div class="analytics-grid reviews-grid">
        <div class="stat-card review">
          <div class="stat-icon">👀</div>
          <div class="stat-content">
            <div class="stat-value">{userAnalytics.reviews.totalReviews}</div>
            <div class="stat-label">Reports Reviewed</div>
          </div>
        </div>
        
        <div class="stat-card review">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <div class="stat-value">{formatDuration(userAnalytics.reviews.timing.avgReviewTimeMs)}</div>
            <div class="stat-label">Avg. Review Time</div>
          </div>
        </div>
        
        <div class="stat-card review">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <div class="stat-value">{formatDuration(userAnalytics.reviews.timing.minReviewTimeMs)}</div>
            <div class="stat-label">Fastest Review</div>
          </div>
        </div>
        
        <div class="stat-card review">
          <div class="stat-icon">🕐</div>
          <div class="stat-content">
            <div class="stat-value">{formatDuration(userAnalytics.reviews.timing.totalReviewTimeMs)}</div>
            <div class="stat-label">Total Review Time</div>
          </div>
        </div>
      </div>
      
      <div class="section-row">
        <div class="section-card">
          <h3>Reviews by Modality</h3>
          {#if userAnalytics.reviews.byModality.length > 0}
            <div class="modality-list">
              {#each userAnalytics.reviews.byModality as item}
                <button 
                  class="modality-item clickable" 
                  on:click={() => openReviewModalityDetail(item.modality)}
                  title="Click to see all {item.modality} reviews"
                >
                  <span class="modality-name">{item.modality}</span>
                  <div class="modality-bar-container">
                    <div 
                      class="modality-bar review-bar" 
                      style="width: {(item.count / userAnalytics.reviews.totalReviews) * 100}%"
                    ></div>
                  </div>
                  <span class="modality-count">{item.count}</span>
                </button>
              {/each}
            </div>
          {:else}
            <p class="empty-message">No reviews yet in this period</p>
          {/if}
        </div>
        
        <div class="section-card">
          <h3>Recent Reviews</h3>
          {#if userAnalytics.reviews.recentActivity.length > 0}
            <div class="activity-table compact">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Modality</th>
                    <th>Review Time</th>
                  </tr>
                </thead>
                <tbody>
                  {#each userAnalytics.reviews.recentActivity as review}
                    <tr>
                      <td>{formatDate(review.createdAt)}</td>
                      <td><span class="modality-badge">{review.modality}</span></td>
                      <td>{formatDuration(review.reviewDurationMs)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="empty-message">No recent reviews</p>
          {/if}
        </div>
      </div>
      {/if}
    </div>
    
  {:else if activeTab === 'organization' && adminAnalytics}
    <div class="admin-filters">
      <div class="filter-group">
        <label for="filter-user">User</label>
        <select id="filter-user" bind:value={localUserId} class="filter-select">
          <option value="all">All Users</option>
          {#if adminAnalytics.filters?.users}
            {#each adminAnalytics.filters.users as user}
              <option value={user.id}>{user.name}</option>
            {/each}
          {/if}
        </select>
      </div>
      
      <div class="filter-group">
        <label for="filter-modality">Modality</label>
        <select id="filter-modality" bind:value={localModality} class="filter-select">
          <option value="all">All Modalities</option>
          {#if adminAnalytics.filters?.modalities}
            {#each adminAnalytics.filters.modalities as mod}
              <option value={mod}>{mod}</option>
            {/each}
          {/if}
        </select>
      </div>
      
      <div class="filter-group">
        <label for="filter-status">Status</label>
        <select id="filter-status" bind:value={localStatus} class="filter-select">
          <option value="all">All Statuses</option>
          {#if adminAnalytics.filters?.statuses}
            {#each adminAnalytics.filters.statuses as status}
              <option value={status}>{status}</option>
            {/each}
          {/if}
        </select>
      </div>
      
      <div class="filter-actions">
        <button class="btn-filter" on:click={applyFilters}>Apply Filters</button>
        <button class="btn-reset" on:click={resetFilters}>Reset</button>
      </div>
    </div>
    
    {#if adminAnalytics.hasFilters && adminAnalytics.orgSummary}
    <div class="org-summary-banner">
      <div class="org-summary-label">Organization Totals (Period):</div>
      <div class="org-summary-stats">
        <span><strong>{adminAnalytics.orgSummary.totalReports}</strong> total reports</span>
        <span><strong>{formatDuration(adminAnalytics.orgSummary.avgReportingTimeMs)}</strong> avg time</span>
        <span><strong>{adminAnalytics.orgSummary.activeDays}</strong> active days</span>
      </div>
    </div>
    {/if}
    
    <div class="analytics-grid">
      <div class="stat-card primary">
        <div class="stat-icon">🏥</div>
        <div class="stat-content">
          <div class="stat-value">{adminAnalytics.summary.totalReports}</div>
          <div class="stat-label">Total Reports</div>
        </div>
      </div>
      
      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{adminAnalytics.summary.signedReports}</div>
          <div class="stat-label">Signed Reports</div>
        </div>
      </div>
      
      <div class="stat-card warning">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{adminAnalytics.summary.submittedReports}</div>
          <div class="stat-label">Pending Review</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-value">{adminAnalytics.summary.completionRate}%</div>
          <div class="stat-label">Completion Rate</div>
        </div>
      </div>
    </div>
    
    <div class="productivity-section">
      <h3>Productivity Metrics</h3>
      <div class="productivity-grid">
        <div class="productivity-card">
          <div class="prod-icon">📈</div>
          <div class="prod-value">{adminAnalytics.productivity.reportsPerDay}</div>
          <div class="prod-label">Reports/Day</div>
        </div>
        <div class="productivity-card">
          <div class="prod-icon">📅</div>
          <div class="prod-value">{adminAnalytics.productivity.reportsPerWeek}</div>
          <div class="prod-label">Reports/Week</div>
        </div>
        <div class="productivity-card">
          <div class="prod-icon">⏱️</div>
          <div class="prod-value">{formatDuration(adminAnalytics.productivity.avgReportingTimeMs)}</div>
          <div class="prod-label">Avg. Time/Report</div>
        </div>
        <div class="productivity-card">
          <div class="prod-icon">⚡</div>
          <div class="prod-value">{formatDuration(adminAnalytics.productivity.minReportingTimeMs)}</div>
          <div class="prod-label">Fastest Report</div>
        </div>
        <div class="productivity-card">
          <div class="prod-icon">⏰</div>
          <div class="prod-value">{formatDuration(adminAnalytics.productivity.totalTimeSpentMs)}</div>
          <div class="prod-label">Total Time Invested</div>
        </div>
        <div class="productivity-card">
          <div class="prod-icon">📆</div>
          <div class="prod-value">{adminAnalytics.productivity.activeDays}</div>
          <div class="prod-label">Active Days</div>
        </div>
      </div>
    </div>
    
    <div class="analytics-sections">
      <div class="section-row">
        <div class="section-card">
          <h3>Top Reporters</h3>
          {#if adminAnalytics.byUser.length > 0}
            <div class="user-list">
              {#each adminAnalytics.byUser as user, i}
                <div class="user-item">
                  <span class="user-rank">#{i + 1}</span>
                  <span class="user-name">{user.userName}</span>
                  <span class="user-count">{user.count} reports</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="empty-message">No data available</p>
          {/if}
        </div>
        
        <div class="section-card">
          <h3>Reports by Modality</h3>
          {#if adminAnalytics.byModality.length > 0}
            <div class="modality-list">
              {#each adminAnalytics.byModality as item}
                <div class="modality-item">
                  <span class="modality-name">{item.modality}</span>
                  <div class="modality-bar-container">
                    <div 
                      class="modality-bar" 
                      style="width: {adminAnalytics.summary.totalReports > 0 ? (item.count / adminAnalytics.summary.totalReports) * 100 : 0}%"
                    ></div>
                  </div>
                  <span class="modality-count">{item.count}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="empty-message">No data available</p>
          {/if}
        </div>
      </div>
      
      <div class="section-card full-width">
        <h3>User Performance Comparison</h3>
        {#if adminAnalytics.userPerformance.length > 0}
          <div class="activity-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Reports</th>
                  <th>Avg. Time</th>
                  <th>Fastest</th>
                  <th>Total Time</th>
                </tr>
              </thead>
              <tbody>
                {#each adminAnalytics.userPerformance as user}
                  <tr>
                    <td>{user.userName}</td>
                    <td><strong>{user.reportCount}</strong></td>
                    <td>{formatDuration(user.avgTimeMs)}</td>
                    <td>{formatDuration(user.minTimeMs)}</td>
                    <td>{formatDuration(user.totalTimeMs)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="empty-message">No performance data available</p>
        {/if}
      </div>
      
      {#if adminAnalytics.weeklyTrend && adminAnalytics.weeklyTrend.length > 0}
      <div class="section-card full-width">
        <h3>Weekly Productivity Trend</h3>
        <div class="trend-chart">
          {#each adminAnalytics.weeklyTrend as week}
            <div class="trend-bar-container">
              <div class="trend-bar" style="height: {Math.min(100, (week.count / maxWeeklyCount) * 100)}%">
                <span class="trend-value">{week.count}</span>
              </div>
              <span class="trend-label">{week.week}</span>
            </div>
          {/each}
        </div>
      </div>
      {/if}
    </div>
  {/if}
</div>

{#if detailModalOpen}
<AnalyticsDetailModal
  isOpen={detailModalOpen}
  onClose={closeDetailModal}
  title={detailModalTitle}
  period="custom"
  customStartDate={filters.startDate}
  customEndDate={filters.endDate}
  filterModality={detailModalModality}
  sortBy={detailModalSortBy}
  sortOrder={detailModalSortOrder}
  filterType={detailModalFilterType}
/>
{/if}

<style>
  .analytics-page {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .analytics-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .header-left h1 {
    margin: 0;
    font-size: 1.75rem;
    color: #1e293b;
  }
  
  .subtitle {
    margin: 0.25rem 0 0 0;
    color: #64748b;
    font-size: 0.9rem;
  }
  
  .header-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }
  
  .btn-export-excel {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: #16a34a;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-export-excel:hover:not(:disabled) {
    background: #15803d;
    transform: translateY(-1px);
  }
  
  .btn-export-excel:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
  
  :global([data-theme="dark"]) .btn-export-excel {
    background: #22c55e;
  }
  
  :global([data-theme="dark"]) .btn-export-excel:hover:not(:disabled) {
    background: #16a34a;
  }
  
  .tab-switcher {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    padding: 0.25rem;
    background: #f1f5f9;
    border-radius: 10px;
    width: fit-content;
  }
  
  .tab-btn {
    padding: 0.6rem 1.25rem;
    border: none;
    background: transparent;
    color: #64748b;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .tab-btn.active {
    background: white;
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .admin-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    align-items: flex-end;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .filter-group label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    color: #1e293b;
    font-size: 0.85rem;
    min-width: 150px;
    cursor: pointer;
  }
  
  .filter-actions {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
  }
  
  .btn-filter {
    padding: 0.5rem 1rem;
    background: var(--primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .btn-filter:hover {
    background: #2563eb;
  }
  
  .btn-reset {
    padding: 0.5rem 1rem;
    background: transparent;
    color: #64748b;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-reset:hover {
    background: #f1f5f9;
  }
  
  .org-summary-banner {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .org-summary-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--primary, #3b82f6);
  }
  
  .org-summary-stats {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  
  .org-summary-stats span {
    font-size: 0.85rem;
    color: #64748b;
  }
  
  .org-summary-stats strong {
    color: #1e293b;
  }
  
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    color: #64748b;
  }
  
  .btn-retry {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  
  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .stat-icon {
    font-size: 1.5rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #f1f5f9;
  }
  
  .stat-card.primary .stat-icon { background: rgba(59, 130, 246, 0.1); }
  .stat-card.success .stat-icon { background: rgba(34, 197, 94, 0.1); }
  .stat-card.warning .stat-icon { background: rgba(234, 179, 8, 0.1); }
  .stat-card.info .stat-icon { background: rgba(99, 102, 241, 0.1); }
  .stat-card.accent .stat-icon { background: rgba(139, 92, 246, 0.1); }
  .stat-card.review .stat-icon { background: rgba(236, 72, 153, 0.1); }
  
  .section-divider {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid #e2e8f0;
  }
  
  .reviews-header {
    margin: 0;
    font-size: 1.25rem;
    color: #1e293b;
    font-weight: 600;
  }
  
  .reviews-subtitle {
    margin: 0.25rem 0 1rem 0;
    color: #64748b;
    font-size: 0.85rem;
  }
  
  .reviews-grid {
    margin-bottom: 1.5rem;
  }
  
  .modality-bar.review-bar {
    background: linear-gradient(135deg, #ec4899, #f472b6);
  }
  
  .activity-table.compact table {
    font-size: 0.875rem;
  }
  
  .activity-table.compact th,
  .activity-table.compact td {
    padding: 0.5rem 0.75rem;
  }
  
  :global([data-theme="dark"]) .section-divider {
    border-top-color: #475569;
  }
  
  :global([data-theme="dark"]) .reviews-header {
    color: #f1f5f9;
  }
  
  :global([data-theme="dark"]) .reviews-subtitle {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .stat-card.review .stat-icon {
    background: rgba(236, 72, 153, 0.2);
  }
  
  :global([data-theme="dark"]) .stat-icon {
    background: #334155;
  }
  
  :global([data-theme="dark"]) .stat-card.primary .stat-icon { background: rgba(59, 130, 246, 0.2); }
  :global([data-theme="dark"]) .stat-card.success .stat-icon { background: rgba(34, 197, 94, 0.2); }
  :global([data-theme="dark"]) .stat-card.warning .stat-icon { background: rgba(234, 179, 8, 0.2); }
  :global([data-theme="dark"]) .stat-card.info .stat-icon { background: rgba(99, 102, 241, 0.2); }
  :global([data-theme="dark"]) .stat-card.accent .stat-icon { background: rgba(139, 92, 246, 0.2); }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
  }
  
  .stat-label {
    font-size: 0.8rem;
    color: #64748b;
  }
  
  .productivity-section {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }
  
  .productivity-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #1e293b;
    font-weight: 600;
  }
  
  .productivity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
  }
  
  .productivity-card {
    text-align: center;
    padding: 1rem;
    background: #f1f5f9;
    border-radius: 10px;
    transition: transform 0.2s;
  }
  
  .productivity-card:hover {
    transform: translateY(-2px);
  }
  
  .prod-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .prod-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
  }
  
  .prod-label {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }
  
  .analytics-sections {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .section-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .section-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 1.25rem;
  }
  
  .section-card.full-width {
    grid-column: 1 / -1;
  }
  
  .section-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #1e293b;
    font-weight: 600;
  }
  
  .modality-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .modality-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    font: inherit;
  }
  
  .modality-item.clickable {
    cursor: pointer;
    padding: 0.5rem;
    margin: -0.5rem;
    border-radius: 8px;
    transition: background 0.2s;
  }
  
  .modality-item.clickable:hover {
    background: #f1f5f9;
  }
  
  .modality-name {
    width: 100px;
    font-size: 0.85rem;
    color: #1e293b;
  }
  
  .modality-bar-container {
    flex: 1;
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .modality-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary, #3b82f6), #60a5fa);
    border-radius: 4px;
    min-width: 4px;
  }
  
  .modality-count {
    min-width: 40px;
    text-align: right;
    font-weight: 600;
    font-size: 0.85rem;
    color: #1e293b;
  }
  
  .timing-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .timing-item {
    padding: 0.75rem;
    background: #f1f5f9;
    border-radius: 8px;
    border: none;
    text-align: left;
    font: inherit;
    width: 100%;
  }
  
  .timing-item.clickable {
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }
  
  .timing-item.clickable:hover {
    background: #e2e8f0;
    border-color: var(--primary, #3b82f6);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  }
  
  .timing-label {
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
  }
  
  .timing-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
  }
  
  .activity-table {
    overflow-x: auto;
  }
  
  .activity-table table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .activity-table th,
  .activity-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .activity-table th {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .activity-table td {
    font-size: 0.9rem;
    color: #1e293b;
  }
  
  .modality-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #f1f5f9;
    color: #64748b;
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
  
  .status-badge.signed { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
  .status-badge.submitted { background: rgba(234, 179, 8, 0.1); color: #ca8a04; }
  .status-badge.draft { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
  
  .user-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .user-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 6px;
    background: #f1f5f9;
  }
  
  .user-rank {
    font-weight: 700;
    color: var(--primary, #3b82f6);
    min-width: 30px;
  }
  
  .user-name {
    flex: 1;
    font-size: 0.9rem;
    color: #1e293b;
  }
  
  .user-count {
    font-size: 0.8rem;
    color: #64748b;
  }
  
  .empty-message {
    color: #64748b;
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }
  
  .trend-chart {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
    height: 150px;
    padding: 1rem 0;
    overflow-x: auto;
  }
  
  .trend-bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
    height: 100%;
  }
  
  .trend-bar {
    width: 40px;
    background: linear-gradient(180deg, var(--primary, #3b82f6), #60a5fa);
    border-radius: 4px 4px 0 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    min-height: 20px;
    transition: height 0.3s ease;
  }
  
  .trend-value {
    font-size: 0.7rem;
    font-weight: 600;
    color: white;
    padding-top: 4px;
  }
  
  .trend-label {
    font-size: 0.65rem;
    color: #64748b;
    margin-top: 0.5rem;
    text-align: center;
  }

  :global([data-theme="dark"]) .filter-select {
    background: #1e293b;
    border-color: #475569;
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .filter-select option {
    background: #1e293b;
    color: #e2e8f0;
  }
  
  @media (max-width: 768px) {
    .analytics-header {
      flex-direction: column;
    }
    
    .analytics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .timing-grid {
      grid-template-columns: 1fr;
    }
    
    .admin-filters {
      flex-direction: column;
    }
    
    .filter-actions {
      margin-left: 0;
      width: 100%;
    }
    
    .filter-actions button {
      flex: 1;
    }
  }
  
  /* Dark theme overrides */
  :global([data-theme="dark"]) .header-left h1 {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .subtitle {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .tab-switcher {
    background: #1e293b;
  }
  
  :global([data-theme="dark"]) .tab-btn {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .tab-btn.active {
    background: #334155;
    color: #3b82f6;
  }
  
  :global([data-theme="dark"]) .stat-card {
    background: #1e293b;
    border-color: #475569;
  }
  
  :global([data-theme="dark"]) .stat-value {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .stat-label {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .admin-filters {
    background: #1e293b;
    border-color: #475569;
  }
  
  :global([data-theme="dark"]) .filter-group label {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .filter-select {
    background: #1e293b;
    border-color: #475569;
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .productivity-section {
    background: #1e293b;
    border-color: #475569;
  }
  
  :global([data-theme="dark"]) .section-title {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .productivity-value {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .productivity-label {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .chart-card {
    background: #1e293b;
    border-color: #475569;
  }
  
  :global([data-theme="dark"]) .chart-title {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .bar-label {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .bar-count {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .table-card {
    background: #1e293b;
    border-color: #475569;
  }
  
  :global([data-theme="dark"]) .table-card th {
    background: #334155;
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .table-card td {
    border-color: #475569;
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .table-card tr:hover {
    background: #334155;
  }
  
  :global([data-theme="dark"]) .leaderboard-card {
    background: #1e293b;
    border-color: #475569;
  }
  
  :global([data-theme="dark"]) .leaderboard-name {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .leaderboard-count {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .btn-reset {
    color: #94a3b8;
    border-color: #475569;
  }
  
  :global([data-theme="dark"]) .btn-reset:hover {
    background: #334155;
  }
  
  :global([data-theme="dark"]) .org-summary-stats strong {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .section-card {
    background: #1e293b;
    border-color: #475569;
  }
  
  :global([data-theme="dark"]) .timing-item {
    background: #334155;
  }

  :global([data-theme="dark"]) .timing-item.clickable:hover {
    background: #475569;
  }
  
  :global([data-theme="dark"]) .timing-value {
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .timing-label {
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .modality-badge {
    background: #334155;
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .activity-table th {
    background: #334155;
    color: #94a3b8;
  }
  
  :global([data-theme="dark"]) .activity-table td {
    border-color: #475569;
    color: #e2e8f0;
  }
  
  :global([data-theme="dark"]) .activity-table tr:hover {
    background: #334155;
  }

  :global([data-theme="dark"]) .section-card h3 {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .modality-name {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .modality-count {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .modality-bar-container {
    background: #475569;
  }

  :global([data-theme="dark"]) .modality-item.clickable:hover {
    background: #334155;
  }
</style>
