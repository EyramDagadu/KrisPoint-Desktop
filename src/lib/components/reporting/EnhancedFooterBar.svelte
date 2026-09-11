<!-- Enhanced FooterBar with Streamlined Report Workflow -->
<script>
  import { professionalPDFService } from '$lib/services/ProfessionalPDFService.js';
  import { completionService } from '$lib/services/CompletionService.js';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { reportData, patientData, reportActions } from '$lib/stores/reportStore.js';
  import { reportBadgeCounts } from '$lib/stores/reportBadgeStore.js';
  import Tooltip from '$lib/components/ui/Tooltip.svelte';
  import PDFPreviewModal from './PDFPreviewModal.svelte';
  import { editionCapabilities } from '$lib/config/edition';
  
  export let isSaved = true;
  export let lastSaveTime = null;
  export let wordCount = 0;
  export let reportStatus = 'DRAFT'; // 'DRAFT', 'SUBMITTED', 'SIGNED'
  export let readOnly = false;
  export let isLoadingReport = false;
  export let reportId = null;
  
  // Permission-based props
  export let canSubmitForReview = false;   // User can submit reports to specialists
  export let canSignReport = false;         // User can sign/finalize reports (specialists)
  export let canSignOwnReport = false;      // User can sign own reports (residents)
  export let canReturnReport = false;       // User can return reports to residents (specialists)
  export let isAssignedSpecialist = false;  // Current user is the assigned specialist for this report
  export let isOwner = false;               // Current user created/owns this report
  export let canAddAddendum = false;        // User can add addendums to signed reports
  export let hasSpecialistReview = false;   // Report has been reviewed by specialist (dual-signed)
  export let canUndoSign = false;           // Can undo sign-off (within 15 mins, is signer)
  export let undoSignExpiresAt = null;      // When the undo window expires
  export let lockStatus = { isLocked: false, lockHolder: null, isOwnLock: false }; // Edit lock status
  export let hasLock = false;               // Whether current user has the edit lock
  export let isSigner = false;              // Current user is the signer of this report
  export let isReviewer = false;            // Current user is the reviewer of this report
  export let hasBeenSubmitted = false;      // Report has been submitted at least once (can't release)
  
  // DEBUG: Log hasBeenSubmitted changes
  $: console.log('[EnhancedFooterBar] hasBeenSubmitted =', hasBeenSubmitted, 'isOwner =', isOwner, 'reportId =', reportId);
  
  // Computed: is current user a participant in this report
  $: isParticipant = isOwner || isSigner || isReviewer;
  
  const dispatch = createEventDispatcher();
  
  let exportMessage = '';
  let showPreviewModal = false;
  let showSubmitModal = false;
  let showReturnModal = false;
  let showAddendumModal = false;
  let addendums = [];
  let specialists = [];
  let selectedSpecialistId = null;
  let submitMessage = '';
  let returnReason = '';
  let isSubmitting = false;
  let isReturning = false;
  let isSigning = false;
  let isCancelling = false;
  let showCancelModal = false;
  let cancelReason = '';
  let loadingSpecialists = false;
  
  // Use the passed wordCount prop instead of recomputing
  $: totalWords = wordCount;
  
  // Normalize status for display
  $: normalizedStatus = reportStatus?.toUpperCase() || 'DRAFT';
  $: isDraft = normalizedStatus === 'DRAFT';
  $: isSubmitted = normalizedStatus === 'SUBMITTED';
  $: isSigned = normalizedStatus === 'SIGNED';
  
  // Compute remaining time for the "Undo Sign Off" window
  let undoRemainingTime = '';
  let isUndoing = false;
  let undoCountdownInterval = null;
  
  function updateUndoRemainingTime() {
    if (!canUndoSign || !undoSignExpiresAt) {
      undoRemainingTime = '';
      return;
    }
    
    const expiresAt = new Date(undoSignExpiresAt).getTime();
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) {
      undoRemainingTime = 'Expired';
      if (undoCountdownInterval) {
        clearInterval(undoCountdownInterval);
        undoCountdownInterval = null;
      }
      return;
    }
    
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      undoRemainingTime = `${minutes}m ${seconds}s to undo`;
    } else {
      undoRemainingTime = `${seconds}s to undo`;
    }
  }
  
  // Start/stop countdown when canUndoSign or undoSignExpiresAt changes
  $: if (canUndoSign && undoSignExpiresAt) {
    updateUndoRemainingTime();
    if (!undoCountdownInterval) {
      undoCountdownInterval = setInterval(updateUndoRemainingTime, 1000);
    }
  } else {
    if (undoCountdownInterval) {
      clearInterval(undoCountdownInterval);
      undoCountdownInterval = null;
    }
    undoRemainingTime = '';
  }
  
  onDestroy(() => {
    if (undoCountdownInterval) {
      clearInterval(undoCountdownInterval);
    }
  });
  
  // Calculate medical completion percentage using proper clinical criteria
  $: completionResult = completionService.computeReportCompletion($reportData, $patientData, reportStatus);
  $: completionPercent = completionResult.percent;
  $: missingItems = completionResult.missing;
  $: completionSummary = completionService.getCompletionSummary(completionResult);
  
  function handleSaveDraft() {
    // Allow saving for DRAFT reports only (SIGNED reports are read-only)
    if (!isDraft && !isSubmitted) {
      exportMessage = '⚠️ Cannot save - report is signed and read-only';
      setTimeout(() => { exportMessage = ''; }, 3000);
      return;
    }
    dispatch('saveDraft');
  }
  
  // ===== UNDO SIGN OFF =====
  async function handleUndoSign() {
    if (!reportId || !canUndoSign) return;
    
    isUndoing = true;
    try {
      // Use query param for Windows compatibility
      const response = await fetch(`/api/reports?id=${reportId}&action=undo-sign`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        exportMessage = '✓ Sign-off undone. You can continue editing.';
        dispatch('signUndone');
        reportBadgeCounts.refreshAfterAction();
        setTimeout(() => { exportMessage = ''; }, 4000);
      } else {
        exportMessage = `✗ ${data.error || 'Failed to undo sign-off'}`;
        setTimeout(() => { exportMessage = ''; }, 4000);
      }
    } catch (error) {
      console.error('Undo sign error:', error);
      exportMessage = '✗ Failed to undo sign-off';
      setTimeout(() => { exportMessage = ''; }, 4000);
    } finally {
      isUndoing = false;
    }
  }
  
  function handleExportClick() {
    showPreviewModal = true;
  }
  
  function closePreviewModal() {
    showPreviewModal = false;
  }
  
  function handleExportSuccess(filename) {
    exportMessage = `✓ PDF exported successfully: ${filename}`;
    setTimeout(() => { exportMessage = ''; }, 4000);
  }
  
  function handleExportError(error) {
    exportMessage = '✗ Export failed. Please check your report data and try again.';
    setTimeout(() => { exportMessage = ''; }, 4000);
  }
  
  // Check if report has enough content for export
  $: hasContent = ($reportData.content && $reportData.content.trim().length > 0) && $patientData.name;
  
  // ===== ADDENDUM FUNCTIONS =====
  async function loadAddendums() {
    if (!reportId) return;
    try {
      const response = await fetch(`/api/reports/${reportId}/addendums`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        addendums = data.addendums;
      }
    } catch (error) {
      console.error('Failed to load addendums:', error);
    }
  }
  
  function openAddendumModal() {
    dispatch('toggleAddendumWorkspace');
  }
  
  function closeAddendumModal() {
    showAddendumModal = false;
  }
  
  function handleAddendumCreated(event) {
    addendums = [event.detail, ...addendums];
    dispatch('addendumCreated', event.detail);
  }
  
  function handleAddendumSubmitted(event) {
    addendums = addendums.map(a => a.id === event.detail.id ? event.detail : a);
    dispatch('addendumSubmitted', event.detail);
  }
  
  function handleAddendumSigned(event) {
    addendums = addendums.map(a => a.id === event.detail.id ? event.detail : a);
    dispatch('addendumSigned', event.detail);
  }
  
  function handleAddendumReturned(event) {
    addendums = addendums.map(a => a.id === event.detail.id ? event.detail : a);
    dispatch('addendumReturned', event.detail);
  }
  
  function handleAddendumDeleted(event) {
    addendums = addendums.filter(a => a.id !== event.detail);
    dispatch('addendumDeleted', event.detail);
  }
  
  // ===== SUBMIT FOR REVIEW =====
  async function loadSpecialists() {
    loadingSpecialists = true;
    try {
      const response = await fetch('/api/users/specialists', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        specialists = data.specialists;
      }
    } catch (error) {
      console.error('Failed to load specialists:', error);
    } finally {
      loadingSpecialists = false;
    }
  }
  
  function openSubmitModal() {
    showSubmitModal = true;
    loadSpecialists();
  }
  
  function closeSubmitModal() {
    showSubmitModal = false;
    selectedSpecialistId = null;
    submitMessage = '';
  }
  
  async function handleSubmitForReview() {
    if (!selectedSpecialistId || !reportId) return;
    
    console.log('[SUBMIT DEBUG] Starting submission for report:', reportId, 'to specialist:', selectedSpecialistId);
    
    isSubmitting = true;
    try {
      const currentContent = $reportData.content || '';
      const currentIndication = $patientData.indication || '';
      const currentAge = $patientData.age || '';
      const currentAgeUnit = $patientData.ageUnit || 'years';
      
      const saveController = new AbortController();
      const saveTimeoutId = setTimeout(() => saveController.abort(), 15000);
      
      const saveResponse = await fetch(`/api/reports?id=${reportId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentContent,
          indication: currentIndication,
          age: currentAge,
          ageUnit: currentAgeUnit
        }),
        signal: saveController.signal
      });
      clearTimeout(saveTimeoutId);
      
      if (!saveResponse.ok) {
        const saveError = await saveResponse.json();
        console.error('Save before submit failed:', saveError);
        exportMessage = `✗ Failed to save report: ${saveError.error || 'Unknown error'}`;
        setTimeout(() => { exportMessage = ''; }, 4000);
        isSubmitting = false;
        return;
      }
      
      const submitController = new AbortController();
      const submitTimeoutId = setTimeout(() => submitController.abort(), 15000);
      
      const response = await fetch(`/api/reports?id=${reportId}&action=submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialistId: selectedSpecialistId, message: submitMessage }),
        signal: submitController.signal
      });
      clearTimeout(submitTimeoutId);
      
      const data = await response.json();
      if (data.success) {
        exportMessage = '✓ Report submitted for review';
        closeSubmitModal();
        reportActions.setReportMeta({ hasBeenSubmitted: true });
        dispatch('reportSubmitted', { specialistId: selectedSpecialistId });
        reportBadgeCounts.refreshAfterAction();
        setTimeout(() => { exportMessage = ''; }, 4000);
      } else {
        exportMessage = `✗ ${data.error || 'Failed to submit report'}`;
        setTimeout(() => { exportMessage = ''; }, 4000);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        exportMessage = '✗ Request timed out - please try again';
      } else {
        console.error('Submit error:', error);
        exportMessage = '✗ Failed to submit report';
      }
      setTimeout(() => { exportMessage = ''; }, 4000);
    } finally {
      isSubmitting = false;
    }
  }
  
  // ===== RETURN TO RESIDENT =====
  function openReturnModal() {
    showReturnModal = true;
    returnReason = '';
  }
  
  function closeReturnModal() {
    showReturnModal = false;
    returnReason = '';
  }
  
  async function handleReturnToResident() {
    if (!reportId) return;
    
    isReturning = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`/api/reports?id=${reportId}&action=return`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: returnReason }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        exportMessage = '✓ Report returned to resident';
        closeReturnModal();
        dispatch('reportReturned', { reason: returnReason });
        reportBadgeCounts.refreshAfterAction();
        setTimeout(() => { exportMessage = ''; }, 4000);
      } else {
        exportMessage = `✗ ${data.error || 'Failed to return report'}`;
        setTimeout(() => { exportMessage = ''; }, 4000);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        exportMessage = '✗ Request timed out - please try again';
      } else {
        console.error('Return error:', error);
        exportMessage = '✗ Failed to return report';
      }
      setTimeout(() => { exportMessage = ''; }, 4000);
    } finally {
      isReturning = false;
    }
  }
  
  // ===== SIGN & FINALIZE =====
  async function handleSignReport() {
    if (!reportId) return;
    
    isSigning = true;
    try {
      await reportActions.saveToStorage();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`/api/reports?id=${reportId}&action=sign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        exportMessage = '✓ Report signed and finalized';
        dispatch('reportSigned');
        reportBadgeCounts.refreshAfterAction();
        setTimeout(() => { exportMessage = ''; }, 4000);
      } else {
        exportMessage = `✗ ${data.error || 'Failed to sign report'}`;
        setTimeout(() => { exportMessage = ''; }, 4000);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        exportMessage = '✗ Request timed out - please try again';
      } else {
        console.error('Sign error:', error);
        exportMessage = '✗ Failed to sign report';
      }
      setTimeout(() => { exportMessage = ''; }, 4000);
    } finally {
      isSigning = false;
    }
  }
  
  // ===== RESIDENT SIGN OFF =====
  async function handleResidentSignOff() {
    if (!reportId) return;
    
    isSigning = true;
    try {
      await reportActions.saveToStorage();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`/api/reports?id=${reportId}&action=sign-off`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        exportMessage = '✓ Report signed off successfully';
        dispatch('reportSigned');
        reportBadgeCounts.refreshAfterAction();
        setTimeout(() => { exportMessage = ''; }, 4000);
      } else {
        exportMessage = `✗ ${data.error || 'Failed to sign off report'}`;
        setTimeout(() => { exportMessage = ''; }, 4000);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        exportMessage = '✗ Request timed out - please try again';
      } else {
        console.error('Sign-off error:', error);
        exportMessage = '✗ Failed to sign off report';
      }
      setTimeout(() => { exportMessage = ''; }, 4000);
    } finally {
      isSigning = false;
    }
  }
  
  // ===== REQUEST SPECIALIST REVIEW =====
  let showRequestReviewModal = false;
  let isRequestingReview = false;
  let reviewMessage = '';
  
  function openRequestReviewModal() {
    showRequestReviewModal = true;
    selectedSpecialistId = null;
    reviewMessage = '';
    loadSpecialists();
  }
  
  function closeRequestReviewModal() {
    showRequestReviewModal = false;
    selectedSpecialistId = null;
    reviewMessage = '';
  }
  
  async function handleRequestSpecialistReview() {
    if (!reportId || !selectedSpecialistId) return;
    
    isRequestingReview = true;
    try {
      // Save current patient data (including age) before requesting review
      await reportActions.saveToStorage();
      
      // Use query param for Windows compatibility
      const response = await fetch(`/api/reports?id=${reportId}&action=request-review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          specialistId: selectedSpecialistId,
          message: reviewMessage
        })
      });
      
      const data = await response.json();
      if (data.success) {
        exportMessage = '✓ Specialist review requested';
        closeRequestReviewModal();
        dispatch('reportSubmitted');
        reportBadgeCounts.refreshAfterAction();
        setTimeout(() => { exportMessage = ''; }, 4000);
      } else {
        exportMessage = `✗ ${data.error || 'Failed to request review'}`;
        setTimeout(() => { exportMessage = ''; }, 4000);
      }
    } catch (error) {
      console.error('Request review error:', error);
      exportMessage = '✗ Failed to request specialist review';
      setTimeout(() => { exportMessage = ''; }, 4000);
    } finally {
      isRequestingReview = false;
    }
  }
  
  // ===== CANCEL/RELEASE REPORT =====
  function openCancelModal() {
    showCancelModal = true;
    cancelReason = '';
  }
  
  function closeCancelModal() {
    showCancelModal = false;
    cancelReason = '';
  }
  
  async function handleCancelReport() {
    if (!reportId) return;
    
    isCancelling = true;
    try {
      const response = await fetch(`/api/reports/${reportId}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      
      const data = await response.json();
      if (data.success) {
        exportMessage = '✓ Report released back to worklist';
        closeCancelModal();
        dispatch('reportCancelled');
        reportBadgeCounts.refreshAfterAction();
        setTimeout(() => { exportMessage = ''; }, 4000);
      } else {
        exportMessage = `✗ ${data.error || 'Failed to cancel report'}`;
        setTimeout(() => { exportMessage = ''; }, 4000);
      }
    } catch (error) {
      console.error('Cancel error:', error);
      exportMessage = '✗ Failed to cancel report';
      setTimeout(() => { exportMessage = ''; }, 4000);
    } finally {
      isCancelling = false;
    }
  }
  
  // Get status display text
  function getStatusText() {
    if (isSigned) return 'Signed';
    if (isSubmitted) {
      // For specialist reviewing: show save status, not "Pending Review"
      if (isAssignedSpecialist) {
        if (!isSaved) return 'Unsaved changes';
        return 'In Review';
      }
      return 'Pending Review';
    }
    if (!isSaved) return 'Unsaved changes';
    return 'Draft Saved';
  }
  
  function getStatusClass() {
    if (isSigned) return 'signed';
    if (isSubmitted) {
      // For specialist: show save status styling
      if (isAssignedSpecialist) {
        return isSaved ? 'saved' : 'unsaved';
      }
      return 'submitted';
    }
    return isSaved ? 'saved' : 'unsaved';
  }
</script>

<div class="footer-bar">
  <div class="status-section">
    <div class="save-status">
      <span class="status-indicator {getStatusClass()}">
        {#if isSigned}✅{:else if isSubmitted && isAssignedSpecialist}{#if isSaved}✓{:else}●{/if}{:else if isSubmitted}⏳{:else if isSaved}✓{:else}●{/if}
      </span>
      <span class="status-text">{getStatusText()}</span>
      {#if lastSaveTime && (isDraft || (isSubmitted && isAssignedSpecialist))}
        <span class="save-time">Last: {lastSaveTime.toLocaleTimeString()}</span>
      {/if}
      {#if isSigned && canUndoSign && undoRemainingTime}
        <span class="undo-window-indicator" title="You can undo your sign-off and make changes">
          ⏱️ {undoRemainingTime}
        </span>
      {/if}
    </div>
    
    {#if exportMessage}
      <div class="export-message {exportMessage.includes('✓') ? 'success' : exportMessage.includes('✗') ? 'error' : 'info'}">
        {exportMessage}
      </div>
    {/if}
  </div>
  
  <div class="stats-section">
    <div class="word-count">
      <span class="count-number">{totalWords}</span>
      <span class="count-label">words</span>
    </div>
    <div class="completion-indicator" title="{completionSummary}">
      <div class="completion-bar">
        <div class="completion-fill" style="width: {completionPercent}%"></div>
      </div>
      <span class="completion-text">{completionPercent}% complete</span>
      {#if missingItems.length > 0}
        <div class="missing-indicator" title="Missing: {missingItems.join(', ')}">⚠️</div>
      {/if}
    </div>
  </div>
  
  <div class="actions-section">
    {#if isLoadingReport}
      <!-- Loading state - show minimal UI -->
      <div class="loading-notice">Loading report...</div>
      
    {:else if isSigned}
      <!-- Signed report - show Undo Sign Off (if available), Export, and Request Review options -->
      {#if canUndoSign}
        <Tooltip text="Undo your sign-off and return to draft mode for editing" position="top">
          <button 
            class="btn btn-undo" 
            on:click={handleUndoSign}
            disabled={isUndoing}
          >
            <span class="btn-icon">↩️</span>
            {isUndoing ? 'Undoing...' : 'Undo Sign Off'}
          </button>
        </Tooltip>
      {/if}
      
      {#if editionCapabilities.collaboration && isOwner && !hasSpecialistReview && canSignOwnReport && !canSignReport}
        <!-- Resident-signed report can request specialist review (only for non-specialists) -->
        <Tooltip text="Request a specialist to review and co-sign this report" position="top">
          <button class="btn btn-submit" on:click={openRequestReviewModal}>
            <span class="btn-icon">📤</span>
            Request Specialist Review
          </button>
        </Tooltip>
      {/if}
      
      <Tooltip text={hasContent ? 'Preview and export report to PDF' : 'Add patient info and content to export'} position="top">
        <button 
          class="btn btn-export {!hasContent ? 'disabled' : ''}" 
          on:click={handleExportClick}
          disabled={!hasContent}
        >
          <span class="btn-icon">📋</span>
          Export PDF
        </button>
      </Tooltip>
      
    {:else if editionCapabilities.collaboration && isSubmitted && isAssignedSpecialist && (canReturnReport || canSignReport)}
      <!-- Specialist reviewing a SUBMITTED report that they are assigned to -->
      {#if canReturnReport}
        <Tooltip text="Return report to resident for revisions" position="top">
          <button class="btn btn-return" on:click={openReturnModal}>
            <span class="btn-icon">↩️</span>
            Return to Resident
          </button>
        </Tooltip>
      {/if}
      
      {#if canSignReport}
        <Tooltip text="Sign and finalize this report" position="top">
          <button 
            class="btn btn-sign" 
            on:click={handleSignReport}
            disabled={isSigning}
          >
            <span class="btn-icon">✍️</span>
            {isSigning ? 'Signing...' : 'Sign & Finalize'}
          </button>
        </Tooltip>
      {/if}
      
    {:else if editionCapabilities.collaboration && isSubmitted}
      <!-- SUBMITTED report viewed by someone other than assigned specialist -->
      <div class="pending-notice">Awaiting specialist review</div>
      
    {:else if editionCapabilities.collaboration && readOnly && isDraft && isAssignedSpecialist}
      <!-- Specialist viewing a DRAFT report they returned - awaiting resident corrections -->
      <div class="pending-notice">Awaiting resident corrections</div>
      
    {:else if readOnly}
      <!-- Read-only mode for non-signed reports - no export available -->
      <div class="pending-notice">View only</div>
      
    {:else if isDraft}
      <!-- Draft mode - show full workflow options -->
      {#if editionCapabilities.collaboration && canSubmitForReview && reportId}
        <Tooltip text="Submit this report to a specialist for review and sign-off" position="top">
          <button class="btn btn-submit" on:click={openSubmitModal}>
            <span class="btn-icon">📤</span>
            Submit for Review
          </button>
        </Tooltip>
      {/if}
      
      {#if canSignOwnReport && isOwner && reportId && !canSignReport}
        <!-- Resident can sign off their own report directly -->
        <Tooltip text="Sign off this report yourself (single signature)" position="top">
          <button 
            class="btn btn-sign-off" 
            on:click={handleResidentSignOff}
            disabled={isSigning}
          >
            <span class="btn-icon">✍️</span>
            {isSigning ? 'Signing...' : 'Sign Off'}
          </button>
        </Tooltip>
      {/if}
      
      {#if canSignReport && isOwner && reportId}
        <!-- Specialist can sign and finalize -->
        <Tooltip text="Sign and finalize this report" position="top">
          <button 
            class="btn btn-sign" 
            on:click={handleSignReport}
            disabled={isSigning}
          >
            <span class="btn-icon">✍️</span>
            {isSigning ? 'Signing...' : 'Sign & Finalize'}
          </button>
        </Tooltip>
      {/if}
      
      {#if editionCapabilities.sharedWorklist && isOwner && reportId && !hasBeenSubmitted}
        <!-- Cancel/Release report back to worklist (only if never submitted) -->
        <Tooltip text="Release this report back to the worklist so someone else can pick it up" position="top">
          <button 
            class="btn btn-cancel" 
            on:click={openCancelModal}
            disabled={isCancelling}
          >
            <span class="btn-icon">↩️</span>
            Release Case
          </button>
        </Tooltip>
      {/if}
      
    {:else if editionCapabilities.collaboration}
      <!-- Submitted but not assigned specialist - just show status -->
      <div class="pending-notice">Awaiting specialist review</div>
    {/if}
  </div>
</div>

<PDFPreviewModal 
  isOpen={showPreviewModal} 
  onClose={closePreviewModal}
  onExportSuccess={handleExportSuccess}
  onExportError={handleExportError}
/>


<!-- Submit for Review Modal -->
{#if editionCapabilities.collaboration && showSubmitModal}
  <div class="modal-overlay" on:click={closeSubmitModal}>
    <div class="submit-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Submit Report for Review</h3>
        <button class="close-btn" on:click={closeSubmitModal}>×</button>
      </div>
      <div class="modal-body">
        <p class="modal-desc">Select a specialist to review and sign off on this report:</p>
        {#if loadingSpecialists}
          <div class="loading">Loading specialists...</div>
        {:else if specialists.length === 0}
          <div class="no-specialists">No specialists available</div>
        {:else}
          <select bind:value={selectedSpecialistId} class="specialist-select">
            <option value={null}>-- Select a Specialist --</option>
            {#each specialists as specialist}
              <option value={specialist.id}>
                {specialist.name}{specialist.specialty ? ` - ${specialist.specialty}` : ''}
              </option>
            {/each}
          </select>
          
          <div class="message-section">
            <label class="message-label">Message for specialist (optional):</label>
            <textarea 
              bind:value={submitMessage} 
              class="submit-message-input"
              placeholder="Add any notes or context for the reviewing specialist..."
              rows="3"
            ></textarea>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" on:click={closeSubmitModal}>Cancel</button>
        <button 
          class="btn btn-submit" 
          on:click={handleSubmitForReview}
          disabled={!selectedSpecialistId || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Request Specialist Review Modal (for signed reports) -->
{#if editionCapabilities.collaboration && showRequestReviewModal}
  <div class="modal-overlay" on:click={closeRequestReviewModal}>
    <div class="submit-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Request Specialist Review</h3>
        <button class="close-btn" on:click={closeRequestReviewModal}>×</button>
      </div>
      <div class="modal-body">
        <p class="modal-desc">Select a specialist to review and co-sign this report:</p>
        {#if loadingSpecialists}
          <div class="loading">Loading specialists...</div>
        {:else if specialists.length === 0}
          <div class="no-specialists">No specialists available</div>
        {:else}
          <select bind:value={selectedSpecialistId} class="specialist-select">
            <option value={null}>-- Select a Specialist --</option>
            {#each specialists as specialist}
              <option value={specialist.id}>
                {specialist.name}{specialist.specialty ? ` - ${specialist.specialty}` : ''}
              </option>
            {/each}
          </select>
          
          <div class="message-section">
            <label class="message-label">Message for specialist (optional):</label>
            <textarea 
              bind:value={reviewMessage} 
              class="submit-message-input"
              placeholder="Add any notes or context for the reviewing specialist..."
              rows="3"
            ></textarea>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" on:click={closeRequestReviewModal}>Cancel</button>
        <button 
          class="btn btn-submit" 
          on:click={handleRequestSpecialistReview}
          disabled={!selectedSpecialistId || isRequestingReview}
        >
          {isRequestingReview ? 'Requesting...' : 'Request Review'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Return to Resident Modal -->
{#if editionCapabilities.collaboration && showReturnModal}
  <div class="modal-overlay" on:click={closeReturnModal}>
    <div class="submit-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Return Report to Resident</h3>
        <button class="close-btn" on:click={closeReturnModal}>×</button>
      </div>
      <div class="modal-body">
        <p class="modal-desc">Provide feedback for the resident (optional):</p>
        <textarea 
          bind:value={returnReason} 
          class="return-reason-input"
          placeholder="Enter feedback or reason for returning the report..."
          rows="4"
        ></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" on:click={closeReturnModal}>Cancel</button>
        <button 
          class="btn btn-return" 
          on:click={handleReturnToResident}
          disabled={isReturning}
        >
          {isReturning ? 'Returning...' : 'Return Report'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Cancel/Release Report Modal -->
{#if editionCapabilities.sharedWorklist && showCancelModal}
  <div class="modal-overlay" on:click={closeCancelModal}>
    <div class="submit-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Release Case</h3>
        <button class="close-btn" on:click={closeCancelModal}>×</button>
      </div>
      <div class="modal-body">
        <p class="modal-desc">This will release the case back to the worklist so another doctor can pick it up. Any work you've done on this report will be cleared.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" on:click={closeCancelModal}>Keep Working</button>
        <button 
          class="btn btn-cancel" 
          on:click={handleCancelReport}
          disabled={isCancelling}
        >
          {isCancelling ? 'Releasing...' : 'Release Case'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .footer-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: var(--color-surface, #ffffff);
    border-top: 1px solid var(--color-border, #e5e7eb);
    min-height: 60px;
    gap: 1rem;
  }
  
  .status-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 200px;
  }
  
  .save-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
  }
  
  .status-indicator.saved {
    color: var(--color-success, #10b981);
  }
  
  .status-indicator.unsaved {
    color: var(--color-warning, #f59e0b);
    animation: pulse 2s infinite;
  }
  
  .status-indicator.submitted {
    color: var(--color-primary, #3b82f6);
  }
  
  .status-indicator.signed {
    color: var(--color-success, #059669);
  }
  
  .status-text {
    font-weight: 500;
    color: var(--color-text-primary, #374151);
  }
  
  .save-time {
    color: var(--color-text-muted, #6b7280);
    font-size: 0.75rem;
  }
  
  .undo-window-indicator {
    color: var(--color-warning, #f59e0b);
    font-size: 0.75rem;
    font-weight: 500;
    background: rgba(245, 158, 11, 0.15);
    padding: 2px 8px;
    border-radius: 4px;
    margin-left: 8px;
    white-space: nowrap;
  }
  
  .btn-undo {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
  }
  
  .btn-undo:hover:not(:disabled) {
    background: linear-gradient(135deg, #d97706, #b45309);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
  
  .btn-undo:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .pending-notice {
    font-size: 0.875rem;
    color: var(--color-primary, #3b82f6);
    font-weight: 500;
    padding: 0.5rem 1rem;
    background: var(--color-primary-light, #eff6ff);
    border-radius: 0.5rem;
  }
  
  .loading-notice {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    font-weight: 500;
    padding: 0.5rem 1rem;
  }
  
  .export-message {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .export-message.success {
    background: var(--color-success-light, #ecfdf5);
    color: var(--color-success, #059669);
    border: 1px solid var(--color-success-border, #a7f3d0);
  }
  
  .export-message.error {
    background: var(--color-danger-light, #fef2f2);
    color: var(--color-danger, #dc2626);
    border: 1px solid var(--color-danger-border, #fca5a5);
  }
  
  .export-message.info {
    background: var(--color-primary-light, #eff6ff);
    color: var(--color-primary, #1d4ed8);
    border: 1px solid var(--color-primary-border, #93c5fd);
  }
  
  .stats-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    min-width: 140px;
  }
  
  .word-count {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }
  
  .count-number {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary, #1f2937);
  }
  
  .count-label {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
  }
  
  .completion-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  
  .completion-bar {
    width: 80px;
    height: 4px;
    background: var(--color-border, #e5e7eb);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .completion-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary, #3b82f6), var(--color-success, #10b981));
    transition: width 0.3s ease;
  }
  
  .completion-text {
    font-size: 0.6rem;
    color: var(--color-text-muted, #6b7280);
    font-weight: 500;
  }

  .missing-indicator {
    font-size: 0.75rem;
    margin-left: 0.25rem;
    cursor: help;
    opacity: 0.8;
  }
  
  .actions-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid transparent;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    text-decoration: none;
    position: relative;
  }
  
  .btn-icon {
    font-size: 1rem;
  }
  
  .btn-outline {
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #374151);
    border-color: var(--color-border, #d1d5db);
  }
  
  .btn-outline:hover {
    background: var(--color-surface-hover, #f9fafb);
    border-color: var(--color-border-hover, #9ca3af);
  }
  
  .btn-submit {
    background: var(--color-primary, #3b82f6);
    color: white;
  }
  
  .btn-submit:hover:not(:disabled) {
    background: var(--color-primary-hover, #2563eb);
  }
  
  .btn-submit:disabled {
    background: var(--color-text-disabled, #9ca3af);
    cursor: not-allowed;
  }
  
  .btn-sign {
    background: var(--color-success, #059669);
    color: white;
  }
  
  .btn-sign:hover:not(:disabled) {
    background: var(--color-success-hover, #047857);
  }
  
  .btn-sign:disabled {
    background: var(--color-text-disabled, #9ca3af);
    cursor: not-allowed;
  }

  :global([data-theme="dark"]) .btn-sign {
    color: #1e293b;
  }
  
  .btn-sign-off {
    background: var(--color-info, #0891b2);
    color: white;
  }
  
  .btn-sign-off:hover:not(:disabled) {
    background: var(--color-info-hover, #0e7490);
  }
  
  .btn-sign-off:disabled {
    background: var(--color-text-disabled, #9ca3af);
    cursor: not-allowed;
  }
  
  :global([data-theme="dark"]) .btn-sign-off {
    color: #1e293b;
  }
  
  .btn-return {
    background: var(--color-warning, #f59e0b);
    color: white;
  }
  
  .btn-return:hover:not(:disabled) {
    background: var(--color-warning-hover, #d97706);
  }
  
  .btn-return:disabled {
    background: var(--color-text-disabled, #9ca3af);
  }
  
  .btn-cancel {
    background: transparent;
    color: var(--color-text-primary, #374151);
    border: 2px solid var(--color-border, #d1d5db);
  }
  
  .btn-cancel:hover:not(:disabled) {
    background: var(--color-error, #ef4444);
    color: white;
    border-color: var(--color-error, #ef4444);
  }
  
  .btn-cancel:disabled {
    background: transparent;
    color: var(--color-text-disabled, #9ca3af);
    border-color: var(--color-text-disabled, #9ca3af);
    cursor: not-allowed;
  }

  :global([data-theme="dark"]) .btn-cancel {
    color: var(--color-text-primary, #e2e8f0);
    border-color: var(--color-border, #475569);
  }

  :global([data-theme="dark"]) .btn-cancel:hover:not(:disabled) {
    background: var(--color-error, #ef4444);
    color: white;
    border-color: var(--color-error, #ef4444);
  }
  
  .btn-export {
    background: var(--color-success, #059669);
    color: white;
    position: relative;
  }
  
  .btn-export:hover:not(.disabled) {
    background: var(--color-success-hover, #047857);
  }
  
  .btn-export.disabled {
    background: var(--color-text-disabled, #9ca3af);
    cursor: not-allowed;
  }

  :global([data-theme="dark"]) .btn-export {
    color: #1e293b;
  }
  
  .btn-addendum {
    background: var(--color-info, #6366f1);
    color: white;
  }
  
  .btn-addendum:hover {
    background: var(--color-info-hover, #4f46e5);
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
  
  .submit-modal {
    background: var(--color-surface, #ffffff);
    border-radius: 0.75rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    min-width: 400px;
    max-width: 90vw;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #1f2937);
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-muted, #6b7280);
    padding: 0;
    line-height: 1;
  }
  
  .close-btn:hover {
    color: var(--color-text-primary, #1f2937);
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-desc {
    margin: 0 0 1rem;
    color: var(--color-text-secondary, #4b5563);
  }
  
  .specialist-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #374151);
  }
  
  .specialist-select:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .return-reason-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #374151);
    resize: vertical;
    font-family: inherit;
  }
  
  .return-reason-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .message-section {
    margin-top: 1rem;
  }
  
  .message-label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #4b5563);
  }
  
  .submit-message-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #374151);
    resize: vertical;
    font-family: inherit;
  }
  
  .submit-message-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .loading, .no-specialists {
    padding: 1rem;
    text-align: center;
    color: var(--color-text-muted, #6b7280);
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @media (max-width: 1024px) {
    .footer-bar {
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    
    .status-section,
    .stats-section {
      min-width: auto;
    }
  }
  
  @media (max-width: 768px) {
    .footer-bar {
      flex-direction: column;
      align-items: stretch;
      padding: 1rem;
      gap: 1rem;
    }
    
    .status-section,
    .stats-section,
    .actions-section {
      justify-content: center;
      text-align: center;
    }
    
    .actions-section {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>
