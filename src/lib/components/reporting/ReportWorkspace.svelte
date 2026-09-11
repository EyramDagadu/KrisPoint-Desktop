<!-- src/lib/components/reporting/ReportWorkspace.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import { 
    reportData, 
    patientData, 
    uiState, 
    reportActions, 
    uiActions,
    hasCompletePatientData
  } from '../../stores/reportStore.js';
  import { permissions, currentUser } from '../../stores/authStore.js';
  import { isLicenseActive, hasFeature } from '../../stores/licenseStore.js';
  
  $: hasVoiceFeature = hasFeature('voice');
  $: hasAIFeature = hasFeature('ai_polish');
  
  const dispatch = createEventDispatcher();
  
  import PatientBanner from './PatientBanner.svelte';
  import PatientHeader from './PatientHeader.svelte';
  import TipTapReportEditor from './TipTapReportEditor.svelte';
  import ToolsPanel from './ToolsPanel.svelte';
  import EnhancedFooterBar from './EnhancedFooterBar.svelte';
  import EnhancedVoiceControl from './EnhancedVoiceControl.svelte';
  import AddendumWorkspace from './AddendumWorkspace.svelte';
  import KeyboardShortcutsPanel from '../ui/KeyboardShortcutsPanel.svelte';
  import ThemeSelector from '../ui/ThemeSelector.svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  
  export let readOnly = false;
  export let reportStatus = 'DRAFT';
  export let isAssignedSpecialist = false;
  export let isOwner = false;
  export let isSigner = false;
  export let isReviewer = false;
  export let hasSpecialistReview = false;
  export let hasBeenSubmitted = false;      // Report was submitted at least once (can't release)
  export let isLoadingReport = false;
  export let canUndoSign = false;
  export let undoSignExpiresAt = null;
  export let lockStatus = { isLocked: false, lockHolder: null, isOwnLock: false };
  export let hasLock = false;
  
  // Service references (will be null during SSR)
  let keyboardShortcutService = null;
  let themeService = null;
  let settingsService = null;
  let voiceControlComponent = null;
  
  // Autosave configuration - debounce-based (save after pause in typing)
  let autoSaveTimeout = null;
  let autosaveConfig = { enabled: true, debounceMs: 1500 }; // 1.5 second debounce after pause
  let eventListenerCleanup = null;

  let currentSection = $uiState.currentSection || 'findings';
  let isSaved = true;
  let lastSaveTime = null;
  let showKeyboardShortcuts = false;
  let showThemeSelector = false;
  let tipTapEditorComponent = null;
  let signedAddendums = [];
  
  // Auto-show addendum workspace for signed reports
  $: showAddendumWorkspace = reportStatus === 'SIGNED';

  // Reactive statements
  $: currentSection = $uiState.currentSection;
  
  // Debounced autosave function - saves after user stops editing
  function triggerDebouncedAutosave() {
    if (!autosaveConfig.enabled || readOnly) return;
    
    // Mark as unsaved
    isSaved = false;
    
    // Clear any existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout
    autoSaveTimeout = setTimeout(async () => {
      if (!isSaved && $reportData.status !== 'finalized') {
        await saveDraftReport(false); // Silent autosave - no notification
      }
    }, autosaveConfig.debounceMs);
  }

  onMount(async () => {
    // Load any saved report on mount
    // Load any saved report data
    // reportActions.loadFromStorage(); // TODO: Implement if needed
    
    // Initialize keyboard shortcut service
    if (browser) {
      try {
        const { keyboardShortcutService: kss } = await import('../../services/KeyboardShortcutService.js');
        keyboardShortcutService = kss;
        
        // Connect voice control keyboard shortcut
        if (keyboardShortcutService) {
          keyboardShortcutService.on('toggleVoice', () => {
            if (voiceControlComponent && voiceControlComponent.toggleVoice) {
              voiceControlComponent.toggleVoice();
            }
          });
        }
      } catch (error) {
        console.error('Error loading keyboard shortcut service:', error);
      }
    }
    
    // Load settings service and configure autosave
    try {
      const { settingsService: ss } = await import('../../services/SettingsService.js');
      settingsService = ss;
      
      // Get current autosave settings
      autosaveConfig = settingsService.getAutosaveSettings();
      
      // Set up autosave if enabled
      setupAutosave();
      
      // Listen for autosave settings changes
      const handleAutosaveSettingsChange = (event) => {
        autosaveConfig = event.detail;
        setupAutosave();
      };
      window.addEventListener('autosaveSettingsChanged', handleAutosaveSettingsChange);
      
      // Store cleanup function for event listener
      eventListenerCleanup = () => {
        window.removeEventListener('autosaveSettingsChanged', handleAutosaveSettingsChange);
      };
    } catch (error) {
      console.error('Error loading settings service:', error);
      // Fallback to default autosave behavior
      setupAutosave();
    }

    // If no complete patient data, show modal
    if (!$hasCompletePatientData) {
      uiActions.showPatientModal();
    }

    // Return cleanup function
    return () => {
      // Clear autosave timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
      }
      
      // Clean up event listener
      if (eventListenerCleanup) {
        eventListenerCleanup();
      }
    };
  });

  function setupAutosave() {
    // Clear any existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }
    
    // Autosave is now debounce-based - triggered by content changes
    // No interval needed - just ensure config is enabled
  }

  function handleSectionChange(section) {
    uiActions.setCurrentSection(section);
  }

  function handleContentChange(event) {
    // Note: TipTapReportEditor already updates the store via reportActions.updateContent()
    // We only need to trigger the debounced autosave here
    triggerDebouncedAutosave();
  }

  async function saveDraftReport(showNotification = true) {
    try {
      const success = await reportActions.saveDraft();
      if (success) {
        isSaved = true;
        lastSaveTime = new Date();
        if (showNotification) {
          uiActions.showSuccessNotification('Draft saved successfully');
        }
      } else {
        if (showNotification) {
          uiActions.showErrorNotification('Failed to save draft - please try again');
        }
      }
      return success;
    } catch (error) {
      console.error('Error saving draft:', error);
      if (showNotification) {
        uiActions.showErrorNotification('Error saving draft: ' + error.message);
      }
      return false;
    }
  }

  async function finalizeReport() {
    try {
      const success = await reportActions.finalizeReport();
      if (success) {
        isSaved = true;
        lastSaveTime = new Date();
        uiActions.showSuccessNotification('Report finalized and saved successfully');
      } else {
        uiActions.showErrorNotification('Failed to finalize report - please try again');
      }
      return success;
    } catch (error) {
      console.error('Error finalizing report:', error);
      uiActions.showErrorNotification('Error finalizing report: ' + error.message);
      return false;
    }
  }

  function handleNewReport() {
    // Clear everything and start fresh
    reportActions.clearReport();
    uiActions.showPatientModal();
    isSaved = true;
  }
  
  function handleReportSubmitted(event) {
    // Report was submitted for review - redirect to worklist
    uiActions.showSuccessNotification('Report submitted for specialist review');
    goto('/worklist');
  }
  
  function handleReportReturned(event) {
    // Report was returned by specialist - navigate to worklist
    uiActions.showSuccessNotification('Report returned to resident');
    goto('/worklist');
  }
  
  function handleReportSigned(event) {
    // Report was signed - update store status and redirect to worklist
    reportActions.setReportStatus('SIGNED');
    reportActions.clearReport(); // Clear so "Continue Reporting" doesn't show old data
    uiActions.showSuccessNotification('Report signed and finalized');
    goto('/worklist');
  }
  
  function handleSignUndone(event) {
    // Sign-off was undone - dispatch event to parent page to reload report with fresh state
    const reportId = $reportData.databaseReportId;
    uiActions.showSuccessNotification('Sign-off undone. Loading draft mode...');
    dispatch('reloadReport', { reportId });
  }
  
  function handleReportCancelled(event) {
    // Report was cancelled/released - navigate back to worklist
    uiActions.showSuccessNotification('Case released back to worklist');
    goto('/worklist');
  }
  
  function handleAddendumSigned(event) {
    // Addendum was signed - show success notification
    uiActions.showSuccessNotification('Addendum signed and added to report');
  }

  async function handlePatientStartReport(event) {
    const { reportId, isUpdate } = event.detail || {};
    
    // Close modal
    uiActions.hidePatientModal();
    
    // If this is just an update to existing patient data (not a new report), we're done
    if (isUpdate) {
      uiActions.showSuccessNotification('Patient information updated');
      return;
    }
    
    if (reportId) {
      // Load the newly created report directly without navigation
      // This works better when already on the reporting page
      try {
        // Use query param for Windows compatibility (SvelteKit [id] routing issue)
        const res = await fetch(`/api/reports?id=${reportId}`, {
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.report) {
            // Clear and load the new report
            reportActions.clearReport();
            
            // Set status
            reportActions.setReportStatus(data.report.status || 'DRAFT');
            // CRITICAL: Use nullish coalescing (??) to preserve true values from clearReport()
            // Using || false would overwrite isOwner to false when API returns undefined
            reportActions.setReportMeta({
              isOwner: data.report.isOwner ?? true,
              isAssignedSpecialist: data.report.isAssignedSpecialist ?? false,
              isSigner: data.report.isSigner ?? false,
              isReviewer: data.report.isReviewer ?? false,
              hasSpecialistReview: data.report.reviewedBy !== null,
              hasBeenSubmitted: data.report.submittedAt !== null && data.report.submittedAt !== undefined
            });
            
            // Split name into firstName/lastName
            const fullName = data.report.patientData?.name || '';
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Calculate age from DOB, otherwise use stored age
            let age = '';
            let ageUnit = data.report.patientData?.ageUnit || 'years';
            const dob = data.report.patientData?.dateOfBirth;
            if (dob && dob !== '0001-01-01' && dob !== '') {
              const birthDate = new Date(dob);
              const today = new Date();
              // Validate that birthDate is a valid date
              if (!isNaN(birthDate.getTime())) {
                const ageInYears = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
                if (ageInYears >= 1) {
                  age = String(ageInYears);
                  ageUnit = 'years';
                } else {
                  const ageInMonths = Math.floor((today - birthDate) / (30.44 * 24 * 60 * 60 * 1000));
                  age = String(ageInMonths);
                  ageUnit = 'months';
                }
              }
            } else if (data.report.patientData?.age) {
              // Use stored age when DOB is not available
              age = String(data.report.patientData.age);
            }
            
            // Keep gender code as uppercase M/F to match dropdown values
            let gender = (data.report.patientData?.gender || '').toUpperCase();
            if (gender !== 'M' && gender !== 'F') {
              const genderLower = (data.report.patientData?.gender || '').toLowerCase();
              if (genderLower === 'male') gender = 'M';
              else if (genderLower === 'female') gender = 'F';
              else gender = '';
            }
            
            // Map display modality names to dropdown values
            const modalityToDropdown = {
              'ct': 'ct', 'mri': 'mri', 'x-ray': 'xray', 'xray': 'xray', 
              'ultrasound': 'us', 'us': 'us', 'mammography': 'mg', 'mg': 'mg',
              'fluoroscopy': 'fl', 'fl': 'fl', 'nuclear medicine': 'nm', 'nm': 'nm',
              'pet-ct': 'petct', 'petct': 'petct'
            };
            const rawModality = (data.report.patientData?.examType || '').toLowerCase();
            const examType = modalityToDropdown[rawModality] || rawModality;
            
            patientData.set({
              name: fullName,
              firstName: firstName,
              lastName: lastName,
              hospitalNumber: data.report.patientData?.hospitalNumber || '',
              age: age,
              ageUnit: ageUnit,
              dateOfBirth: dob || '',
              gender: gender,
              examType: examType,
              examSubtype: data.report.patientData?.examSubtype || '',
              indication: data.report.patientData?.indication || '',
              referringPhysician: data.report.patientData?.referringPhysician || '',
              studyDate: data.report.patientData?.studyDate || new Date().toISOString().split('T')[0],
              accessionNumber: data.report.accessionNumber || '',
              specialistName: '',
              specialistDesignation: 'Radiologist'
            });
            
            // Set database report ID with version timestamp for optimistic concurrency
            reportActions.setDatabaseReportId(reportId, data.report.updatedAt);
            
            // Load content if exists
            if (data.report.content) {
              reportActions.updateContent(data.report.content);
            }
            
            uiActions.showSuccessNotification('Report created - ready to start dictating');
            isSaved = true;
          }
        } else {
          uiActions.showErrorNotification('Failed to load the new report');
        }
      } catch (error) {
        console.error('Error loading new report:', error);
        uiActions.showErrorNotification('Error loading report');
      }
    } else {
      // Fallback: Set focus on first section
      uiActions.setCurrentSection('findings');
    }
  }

  function handlePatientCancel() {
    uiActions.hidePatientModal();
    // If no patient data exists, we stay in empty state
    // Note: Cancel should NOT save - it discards pending changes
  }

  function handleEditPatient() {
    uiActions.showPatientModal();
  }

  function handleKeydown(event) {
    // Alt + number keys for section navigation (allowed in read-only mode)
    if (event.altKey && event.key >= '1' && event.key <= '4') {
      event.preventDefault();
      const sections = ['comparison', 'technique', 'findings', 'impression'];
      const sectionIndex = parseInt(event.key) - 1;
      if (sections[sectionIndex]) {
        handleSectionChange(sections[sectionIndex]);
      }
    }
    
    // Skip all mutation shortcuts in read-only mode
    if (readOnly) return;
    
    // Ctrl/Cmd + S to save draft
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveDraftReport(); // Fire-and-forget for keyboard shortcuts
    }
    
    // Ctrl/Cmd + Shift + S to finalize report
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      finalizeReport(); // Fire-and-forget for keyboard shortcuts
    }
    
    // Ctrl/Cmd + N for new report
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault();
      handleNewReport();
    }
    
    // Ctrl/Cmd + E to edit patient
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
      event.preventDefault();
      if ($hasCompletePatientData) {
        handleEditPatient();
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="report-workspace">
  {#if $hasCompletePatientData}
    <!-- Patient Banner - compact header -->
    <header class="workspace-header">
      <PatientBanner 
        patient={$patientData} 
        on:editPatient={handleEditPatient}
        on:newReport={handleNewReport}
      />
    </header>
    
    <!-- Main Workspace -->
    <main class="workspace-main">
      <aside class="tools-panel">
        <ToolsPanel 
          currentSection={currentSection}
          editorComponent={tipTapEditorComponent}
          {readOnly}
        />
      </aside>

      <section class="editor-panel">
        {#if readOnly}
          <div class="read-only-banner">
            <span class="read-only-icon">🔒</span>
            <span class="read-only-text">View Only Mode - This report cannot be edited</span>
          </div>
        {/if}
        <div class="editor-content-area">
          <TipTapReportEditor bind:this={tipTapEditorComponent} {readOnly} on:contentChange={handleContentChange} />
          
          {#if reportStatus === 'SIGNED'}
            <AddendumWorkspace
              reportId={$reportData.databaseReportId}
              isOpen={showAddendumWorkspace}
              {signedAddendums}
              canAddAddendum={isOwner || isAssignedSpecialist || isSigner}
              {isAssignedSpecialist}
              {isSigner}
              {hasSpecialistReview}
              originalReportReviewedBy={$reportData.reviewedBy}
              on:addendumSigned={handleAddendumSigned}
            />
          {/if}
        </div>
      </section>

      <aside class="voice-panel">
        {#if !hasVoiceFeature}
          <div class="voice-disabled-notice premium-notice">
            <span class="premium-icon">🔒</span>
            <p>Voice dictation requires a premium license.</p>
            <a href="/settings?tab=license" class="upgrade-link">Upgrade</a>
          </div>
        {:else if !readOnly}
          <EnhancedVoiceControl bind:this={voiceControlComponent} />
        {:else}
          <div class="voice-disabled-notice">
            <p>Voice dictation is disabled in view-only mode.</p>
          </div>
        {/if}
      </aside>
    </main>

    <!-- Footer -->
    <footer class="workspace-footer">
      <EnhancedFooterBar 
        {isSaved} 
        {lastSaveTime} 
        reportStatus={reportStatus}
        wordCount={($reportData.content || '').split(/\s+/).filter(w => w.length > 0).length} 
        {readOnly}
        {isLoadingReport}
        reportId={$reportData.databaseReportId}
        canSubmitForReview={$permissions.includes('reports.submit')}
        canSignReport={$permissions.includes('reports.finalize') || $permissions.includes('reports.sign')}
        canSignOwnReport={$permissions.includes('reports.sign_own')}
        canReturnReport={$permissions.includes('reports.review')}
        canAddAddendum={reportStatus === 'SIGNED' && (isOwner || isAssignedSpecialist || isSigner)}
        {isAssignedSpecialist}
        {isOwner}
        {isSigner}
        {isReviewer}
        {hasSpecialistReview}
        {hasBeenSubmitted}
        {canUndoSign}
        {undoSignExpiresAt}
        {lockStatus}
        {hasLock}
        on:saveDraft={saveDraftReport}
        on:signUndone={handleSignUndone}
        on:newReport={handleNewReport}
        on:reportSubmitted={handleReportSubmitted}
        on:reportReturned={handleReportReturned}
        on:reportSigned={handleReportSigned}
        on:reportCancelled={handleReportCancelled}
        on:toggleAddendumWorkspace={toggleAddendumWorkspace}
      />
    </footer>
  {:else}
    <!-- Empty State - when no patient data -->
    <div class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>Welcome to Radiology Reporting</h2>
        <p>Enter patient information to begin your radiology report</p>
        <button class="btn btn-primary btn-large" on:click={handleNewReport}>
          <span class="btn-icon">📋</span>
          Start New Report
        </button>
      </div>
    </div>
  {/if}

  <!-- Patient Information Modal -->
  {#if $uiState.showPatientModal}
    <div class="modal-backdrop" on:click={handlePatientCancel}>
      <div class="modal-container" on:click|stopPropagation>
        <div class="modal-header">
          <h2>
            {$hasCompletePatientData ? 'Edit Patient Information' : 'New Radiology Report'}
          </h2>
          <button class="modal-close" on:click={handlePatientCancel} aria-label="Close">
            ×
          </button>
        </div>
        <div class="modal-content">
          <PatientHeader 
            on:startReport={handlePatientStartReport}
            on:cancel={handlePatientCancel}
          />
        </div>
      </div>
    </div>
  {/if}
  <!-- Notification Toast -->
  {#if $uiState.notification}
    <div class="notification notification-{$uiState.notification.type}" 
         on:click={() => uiActions.hideNotification()}
         transition:fly={{y: -50, duration: 300}}>
      <div class="notification-content">
        <span class="notification-icon">
          {#if $uiState.notification.type === 'success'}
            ✓
          {:else if $uiState.notification.type === 'error'}
            ⚠
          {:else}
            ℹ
          {/if}
        </span>
        <span class="notification-message">{$uiState.notification.message}</span>
        <button class="notification-close" on:click|stopPropagation={() => uiActions.hideNotification()}>
          ×
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .report-workspace {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100vh;
    background-color: var(--color-background, #f8fafc);
    position: relative;
  }

  .workspace-header {
    background: var(--color-surface, #ffffff);
    border-bottom: 1px solid var(--color-border, #e2e8f0);
    flex-shrink: 0;
    color: var(--color-text, #000000);
  }

  .workspace-main {
    flex: 1;
    display: grid;
    grid-template-columns: 300px 1fr 320px;
    gap: 0;
    overflow: visible; /* Allow dropdowns to extend beyond grid boundaries */
    min-height: 0;
    max-height: calc(100% - 60px); /* Reserve space for footer */
    max-width: 100vw;
  }

  .tools-panel {
    background: var(--color-surface, #ffffff);
    border-right: 1px solid var(--color-border, #e2e8f0);
    overflow: visible; /* Allow dropdowns to extend beyond panel boundaries */
    color: var(--color-text, #000000);
  }

  .editor-panel {
    background: var(--color-surface, #ffffff);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid var(--color-border, #e2e8f0);
    color: var(--color-text, #000000);
  }

  .editor-content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  .read-only-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #1f2937;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .read-only-icon {
    font-size: 1rem;
  }

  .read-only-text {
    letter-spacing: 0.025em;
  }

  .voice-panel {
    background: var(--color-background-secondary, #f8fafc);
    overflow-y: auto;
    color: var(--color-text, #000000);
    padding: 1rem;
  }

  .voice-disabled-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
  }

  .voice-disabled-notice p {
    margin: 0;
    padding: 1rem;
  }

  .voice-disabled-notice.premium-notice {
    flex-direction: column;
    gap: 0.75rem;
    padding: 2rem;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-radius: 12px;
    margin: 1rem;
  }

  .premium-notice .premium-icon {
    font-size: 2rem;
  }

  .premium-notice .upgrade-link {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
  }

  .premium-notice .upgrade-link:hover {
    opacity: 0.9;
  }

  .workspace-footer {
    background: var(--color-surface, #ffffff);
    border-top: 1px solid var(--color-border, #e2e8f0);
    flex-shrink: 0;
    color: var(--color-text, #000000);
  }

  /* Empty State Styles */
  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
  }

  .empty-content {
    max-width: 400px;
    padding: 3rem 2rem;
    animation: fadeInUp 0.6s ease-out;
  }

  .empty-icon {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
  }

  .empty-content h2 {
    margin: 0 0 1rem 0;
    font-size: 2rem;
    font-weight: 600;
    color: white;
  }

  .empty-content p {
    margin: 0 0 2rem 0;
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }

  .modal-container {
    background: var(--color-surface, #ffffff);
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideInScale 0.3s ease-out;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2rem 1rem;
    border-bottom: 1px solid var(--color-border, #e2e8f0);
    position: sticky;
    top: 0;
    background: var(--color-surface, #ffffff);
    z-index: 10;
  }

  .modal-header h2 {
    margin: 0;
    color: var(--color-text-primary, #1e293b);
    font-size: 1.75rem;
    font-weight: 700;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.75rem;
    cursor: pointer;
    color: var(--color-text-muted, #64748b);
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    transition: all 0.2s ease-in-out;
  }

  .modal-close:hover {
    color: var(--color-text-primary, #334155);
    background: var(--color-surface-hover, #f1f5f9);
    transform: scale(1.05);
  }

  .modal-content {
    padding: 0 2rem 2rem;
  }

  /* Button Styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.875rem;
    text-decoration: none;
    transition: all 0.2s ease-in-out;
    gap: 0.5rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px -3px rgba(59, 130, 246, 0.4);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .btn-large {
    padding: 1rem 2rem;
    font-size: 1rem;
    border-radius: 0.75rem;
  }

  .btn-icon {
    font-size: 1.25em;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInScale {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Responsive Design */
  @media (max-width: 1200px) {
    .workspace-main {
      grid-template-columns: 250px 1fr 220px;
    }
  }

  @media (max-width: 1024px) {
    .workspace-main {
      grid-template-columns: 200px 1fr;
    }
    
    .voice-panel {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .workspace-main {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }
    
    .tools-panel {
      border-right: none;
      border-bottom: 1px solid #e2e8f0;
      max-height: 200px;
    }
    
    .editor-panel {
      border-right: none;
    }
    
    .modal-container {
      margin: 0.5rem;
      max-height: 95vh;
    }
    
    .modal-header {
      padding: 1.5rem 1.5rem 1rem;
    }
    
    .modal-header h2 {
      font-size: 1.5rem;
    }
    
    .modal-content {
      padding: 0 1.5rem 1.5rem;
    }
    
    .empty-content {
      padding: 2rem 1.5rem;
    }
    
    .empty-content h2 {
      font-size: 1.75rem;
    }
  }

  @media (max-width: 480px) {
    .modal-backdrop {
      padding: 0.5rem;
    }
    
    .btn-large {
      width: 100%;
      padding: 1rem;
    }
  }

  /* Notification Styles */
  .notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 2000;
    min-width: 320px;
    max-width: 500px;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .notification:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.3);
  }

  .notification-success {
    background: var(--color-success, #22c55e);
    color: white;
  }

  .notification-error {
    background: var(--color-danger, #ef4444);
    color: white;
  }

  .notification-info {
    background: var(--color-primary, #3b82f6);
    color: white;
  }

  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
  }

  .notification-icon {
    font-size: 1.25rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .notification-message {
    flex: 1;
    font-weight: 500;
    line-height: 1.4;
  }

  .notification-close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease-in-out;
    flex-shrink: 0;
  }

  .notification-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    transform: scale(1.1);
  }
</style>