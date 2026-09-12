<!-- src/lib/components/reporting/PatientHeader.svelte -->
<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { patientData, patientActions, reportData, reportActions } from '../../stores/reportStore.js';
  import { customOptionsService } from '../../services/CustomOptionsService.js';
  import { currentUser } from '../../stores/authStore.js';
  
  const dispatch = createEventDispatcher();
  
  // Debounced save for patient data changes
  let saveTimeout = null;
  function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      const currentReport = get(reportData);
      if (currentReport.databaseReportId) {
        console.log('Triggering patient data save...');
        const saved = await reportActions.saveToStorage();
        console.log('Patient data auto-saved:', saved);
      }
    }, 1500); // Save 1.5 seconds after last change
  }
  
  onDestroy(() => {
    // Just clear the timeout on unmount - don't save
    // Saves only happen when user explicitly clicks "Start Report" or "Save & Continue"
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
  });
  
  // Check if this is an existing report (opened from worklist or already has a database ID)
  $: isExistingReport = !!$reportData.databaseReportId;

  let customModality = '';
  let customRegion = '';
  let selectedModalities = []; // For custom region modality selection
  let showCustomModal = false;
  let validationErrors = [];

  // Available modalities for custom region selection
  const availableModalities = [
    { value: 'ct', label: 'CT' },
    { value: 'mri', label: 'MRI' },
    { value: 'xray', label: 'X-Ray' },
    { value: 'us', label: 'Ultrasound' },
    { value: 'mg', label: 'Mammography' },
    { value: 'fl', label: 'Fluoroscopy' },
    { value: 'nm', label: 'Nuclear Medicine' }
  ];

  // Predefined modality options
  const baseExamTypes = [
    { value: '', label: 'Select modality' },
    { value: 'ct', label: 'CT' },
    { value: 'mri', label: 'MRI' },
    { value: 'xray', label: 'X-Ray' },
    { value: 'us', label: 'Ultrasound' },
    { value: 'mg', label: 'Mammography' },
    { value: 'fl', label: 'Fluoroscopy' },
    { value: 'nm', label: 'Nuclear Medicine' },
    { value: 'custom', label: 'Custom...' }
  ];

  // Reactive variable for merged exam types (base + custom)
  let examTypes = [...baseExamTypes];

  // Predefined body region options - values MUST match worklist exactly (Title Case)
  const baseExamSubtypes = {
    '': [{ value: '', label: 'Select body region' }],
    'ct': [
      { value: '', label: 'Select body region' },
      { value: 'Head', label: 'Head' },
      { value: 'Neck', label: 'Neck' },
      { value: 'Chest', label: 'Chest' },
      { value: 'Abdomen', label: 'Abdomen' },
      { value: 'Pelvis', label: 'Pelvis' },
      { value: 'Spine', label: 'Spine' },
      { value: 'Extremity', label: 'Extremity' },
      { value: 'Angio', label: 'Angio' },
      { value: 'Cardiac', label: 'Cardiac' },
      { value: 'custom', label: 'Custom...' }
    ],
    'mri': [
      { value: '', label: 'Select body region' },
      { value: 'Brain', label: 'Brain' },
      { value: 'Spine', label: 'Spine' },
      { value: 'MSK', label: 'MSK' },
      { value: 'Body', label: 'Body' },
      { value: 'Breast', label: 'Breast' },
      { value: 'Cardiac', label: 'Cardiac' },
      { value: 'Pelvis', label: 'Pelvis' },
      { value: 'custom', label: 'Custom...' }
    ],
    'xray': [
      { value: '', label: 'Select body region' },
      { value: 'Chest', label: 'Chest' },
      { value: 'Abdomen', label: 'Abdomen' },
      { value: 'Spine', label: 'Spine' },
      { value: 'Extremity', label: 'Extremity' },
      { value: 'Pelvis', label: 'Pelvis' },
      { value: 'custom', label: 'Custom...' }
    ],
    'us': [
      { value: '', label: 'Select body region' },
      { value: 'Abdominal', label: 'Abdominal' },
      { value: 'Pelvic', label: 'Pelvic' },
      { value: 'Vascular', label: 'Vascular' },
      { value: 'Small Parts', label: 'Small Parts' },
      { value: 'Obstetric', label: 'Obstetric' },
      { value: 'custom', label: 'Custom...' }
    ],
    'mg': [
      { value: '', label: 'Select type' },
      { value: 'Screening', label: 'Screening' },
      { value: 'Diagnostic', label: 'Diagnostic' },
      { value: 'custom', label: 'Custom...' }
    ],
    'fl': [
      { value: '', label: 'Select procedure' },
      { value: 'GI Series', label: 'GI Series' },
      { value: 'GU Studies', label: 'GU Studies' },
      { value: 'Arthrography', label: 'Arthrography' },
      { value: 'custom', label: 'Custom...' }
    ],
    'nm': [
      { value: '', label: 'Select study' },
      { value: 'Bone Scan', label: 'Bone Scan' },
      { value: 'Cardiac', label: 'Cardiac' },
      { value: 'Thyroid', label: 'Thyroid' },
      { value: 'Renal', label: 'Renal' },
      { value: 'custom', label: 'Custom...' }
    ],
    'petct': [
      { value: '', label: 'Select body region' },
      { value: 'Whole Body', label: 'Whole Body' },
      { value: 'Brain', label: 'Brain' },
      { value: 'Cardiac', label: 'Cardiac' },
      { value: 'custom', label: 'Custom...' }
    ],
    'custom': [
      { value: '', label: 'Select body region' },
      { value: 'custom', label: 'Custom...' }
    ]
  };

  // Reactive variable for merged exam subtypes (base + custom)
  let examSubtypes = { ...baseExamSubtypes };

  // Load custom options on mount and merge with base options
  onMount(() => {
    loadCustomOptions();
    // Mark as loaded after custom options are available
    customOptionsLoaded = true;
  });

  function loadCustomOptions() {
    // Load custom modalities
    const customModalities = customOptionsService.getCustomModalities();
    
    if (customModalities.length > 0) {
      // Insert custom modalities before "Custom..." option
      const customOptions = customModalities.map(m => ({ value: m, label: m }));
      examTypes = [
        ...baseExamTypes.slice(0, -1), // All base options except "Custom..."
        ...customOptions,                // Custom options
        baseExamTypes[baseExamTypes.length - 1] // "Custom..." option at the end
      ];
      console.log('✅ Loaded custom modalities:', customModalities);
    }

    // CRITICAL FIX: Create subtype lists with modality-specific custom regions
    examSubtypes = { ...baseExamSubtypes };
    
    // Add custom regions to predefined modality lists (filtered by modality)
    Object.keys(examSubtypes).forEach(modality => {
      if (modality !== '') {
        const baseList = baseExamSubtypes[modality];
        // Get custom regions that are available for this modality
        const modalityCustomRegions = customOptionsService.getCustomRegionsForModality(modality);
        const customRegionOptions = modalityCustomRegions.map(r => ({ value: r, label: r }));
        
        examSubtypes[modality] = [
          ...baseList.slice(0, -1),     // All base options except "Custom..."
          ...customRegionOptions,        // Custom regions for THIS modality
          baseList[baseList.length - 1]  // "Custom..." option at the end
        ];
      }
    });
    
    // Create subtype lists for each custom modality
    customModalities.forEach(customModality => {
      const modalityCustomRegions = customOptionsService.getCustomRegionsForModality(customModality);
      const customRegionOptions = modalityCustomRegions.map(r => ({ value: r, label: r }));
      
      examSubtypes[customModality] = [
        { value: '', label: 'Select body region' },
        ...customRegionOptions,  // Include custom regions for THIS custom modality
        { value: 'custom', label: 'Custom...' }  // Allow adding new regions
      ];
    });
  }

  // Normalize modality key to handle worklist uppercase vs local lowercase
  function normalizeModalityKey(modality) {
    if (!modality) return '';
    const modalityMap = {
      'CT': 'ct', 'MRI': 'mri', 'X-Ray': 'xray', 'Ultrasound': 'us',
      'Mammography': 'mg', 'Fluoroscopy': 'fl', 'Nuclear Medicine': 'nm', 'PET-CT': 'petct'
    };
    return modalityMap[modality] || modality.toLowerCase();
  }
  
  $: currentSubtypes = examSubtypes[$patientData.examType] || examSubtypes[normalizeModalityKey($patientData.examType)] || examSubtypes[''];
  
  // Track last known examType to detect when user changes modality
  let lastExamType = '';
  let customOptionsLoaded = false;
  
  // Reset examSubtype ONLY when user changes examType (not on initial load)
  $: if ($patientData.examType && $patientData.examType !== lastExamType) {
    // Only clear examSubtype if the modality was changed BY THE USER (not on initial load)
    if (lastExamType !== '' && customOptionsLoaded) {
      const validSubtypes = currentSubtypes.map(st => st.value);
      if (!validSubtypes.includes($patientData.examSubtype)) {
        patientActions.updateField('examSubtype', '');
      }
    }
    lastExamType = $patientData.examType;
  }

  function handleExamTypeChange(e) {
    const newType = e.target.value;
    patientActions.setExamType(newType);
    
    if (newType === 'custom') {
      showCustomModal = true;
    }
  }

  function handleExamSubtypeChange(e) {
    const newSubtype = e.target.value;
    patientActions.setExamSubtype(newSubtype);
    
    if (newSubtype === 'custom') {
      // Pre-select current modality when opening custom region modal
      if ($patientData.examType && $patientData.examType !== 'custom') {
        selectedModalities = [$patientData.examType];
      } else {
        selectedModalities = [];
      }
      showCustomModal = true;
    }
  }

  function toggleModality(modalityValue) {
    if (selectedModalities.includes(modalityValue)) {
      selectedModalities = selectedModalities.filter(m => m !== modalityValue);
    } else {
      selectedModalities = [...selectedModalities, modalityValue];
    }
  }

  function calculateAgeFromDOB(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) return null;
    
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }
    
    if (years < 1) {
      const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                     today.getMonth() - birthDate.getMonth();
      if (months < 1) {
        const days = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
        return { age: days, unit: 'days' };
      }
      return { age: months, unit: 'months' };
    }
    
    return { age: years, unit: 'years' };
  }

  function handleFieldChange(field, value) {
    patientActions.updateField(field, value);
    
    if (field === 'dateOfBirth' && value) {
      const calculated = calculateAgeFromDOB(value);
      if (calculated) {
        patientActions.updateField('age', calculated.age.toString());
        patientActions.updateField('ageUnit', calculated.unit);
      }
    }
    
    if (validationErrors.length > 0) {
      validateForm();
    }
    debouncedSave();
  }

  function saveCustomSelections() {
    // Save custom modality to current report AND persistent storage
    if (customModality.trim()) {
      const trimmedModality = customModality.trim();
      patientActions.updateField('examType', trimmedModality);
      customOptionsService.addCustomModality(trimmedModality);
      console.log('✅ Custom modality saved to report and storage:', trimmedModality);
    }
    
    // Save custom region to current report AND persistent storage with modality associations
    if (customRegion.trim()) {
      const trimmedRegion = customRegion.trim();
      
      // Validate that at least one modality is selected
      if (selectedModalities.length === 0) {
        alert('Please select at least one modality for this body region');
        return;
      }
      
      patientActions.updateField('examSubtype', trimmedRegion);
      customOptionsService.addCustomRegion(trimmedRegion, selectedModalities);
      console.log('✅ Custom region saved to report and storage:', trimmedRegion, 'for modalities:', selectedModalities);
    }
    
    // Reload custom options to update dropdowns immediately
    loadCustomOptions();
    
    showCustomModal = false;
    customModality = '';
    customRegion = '';
    selectedModalities = [];
  }

  let isSubmitting = false;
  let submitError = '';

  function validateForm() {
    const validation = patientActions.validateRequiredFields($currentUser?.designation);
    validationErrors = validation.errors;
    return validation.isValid;
  }

  async function handleStartReport() {
    if (!validateForm()) return;
    
    isSubmitting = true;
    submitError = '';
    
    try {
      // If this is an existing report, just update patient data and close modal
      // Don't create a new report - avoid duplicates
      if (isExistingReport) {
        // Update patient data in the store (already happens via handleFieldChange)
        // Combine firstName and lastName into full name
        patientActions.updateField('name', `${$patientData.firstName} ${$patientData.lastName}`.trim());
        
        // CRITICAL: Flush any pending debounced save immediately before closing modal
        // This ensures age and other patient data edits are persisted
        if (saveTimeout) {
          clearTimeout(saveTimeout);
          saveTimeout = null;
        }
        await reportActions.saveToStorage();
        
        // Dispatch event to close modal without creating a new report
        dispatch('startReport', { reportId: null, isUpdate: true });
        return;
      }
      
      // Create new report with worklist entry
      const response = await fetch('/api/worklist/create-with-report', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: $patientData.firstName,
          lastName: $patientData.lastName,
          hospitalNumber: $patientData.hospitalNumber,
          gender: $patientData.gender,
          dateOfBirth: $patientData.dateOfBirth,
          age: $patientData.age,
          ageUnit: $patientData.ageUnit || 'years',
          modality: $patientData.examType,
          bodyRegion: $patientData.examSubtype,
          priority: $patientData.priority || 'ROUTINE',
          studyDate: $patientData.studyDate,
          indication: $patientData.indication,
          referringPhysician: $patientData.referringPhysician
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        dispatch('startReport', { reportId: data.reportId, worklistId: data.worklistId });
      } else {
        submitError = data.error || 'Failed to create report';
      }
    } catch (error) {
      console.error('Create report error:', error);
      submitError = 'Failed to create report. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    // Cancel should discard pending changes, not save them
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    dispatch('cancel');
  }
</script>

<div class="patient-header">
  <div class="form-section">
    <div class="section-header">
      <h3>Patient Information</h3>
      {#if $reportData.databaseReportId}
        <span class="report-id-badge">Report ID: R-{$reportData.databaseReportId}</span>
      {/if}
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label for="firstName">First Name *</label>
        <input 
          type="text" 
          id="firstName" 
          value={$patientData.firstName}
          on:input={(e) => handleFieldChange('firstName', e.target.value)}
          placeholder="First name"
          class:error={validationErrors.some(e => e.includes('First name'))}
        >
      </div>
      
      <div class="form-group">
        <label for="lastName">Last Name *</label>
        <input 
          type="text" 
          id="lastName" 
          value={$patientData.lastName}
          on:input={(e) => handleFieldChange('lastName', e.target.value)}
          placeholder="Last name"
          class:error={validationErrors.some(e => e.includes('Last name'))}
        >
      </div>
      
      <div class="form-group">
        <label for="hospitalNumber">Hospital Number *</label>
        <input 
          type="text" 
          id="hospitalNumber" 
          value={$patientData.hospitalNumber}
          on:input={(e) => handleFieldChange('hospitalNumber', e.target.value)}
          placeholder="Enter hospital number"
          class:error={validationErrors.some(e => e.includes('Hospital'))}
        >
      </div>
      
      <div class="form-group">
        <label for="patientGender">Sex *</label>
        <select 
          id="patientGender" 
          value={$patientData.gender}
          on:change={(e) => handleFieldChange('gender', e.target.value)}
          class:error={validationErrors.some(e => e.includes('Sex'))}
        >
          <option value="">Select sex</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="dateOfBirth">Date of Birth</label>
        <input 
          type="date" 
          id="dateOfBirth" 
          value={$patientData.dateOfBirth}
          on:input={(e) => handleFieldChange('dateOfBirth', e.target.value)}
        >
      </div>
      
      <div class="form-group">
        <label for="patientAge">Age</label>
        <div class="age-input-group">
          <input 
            type="number" 
            id="patientAge" 
            value={$patientData.age}
            on:input={(e) => handleFieldChange('age', e.target.value)}
            placeholder="Age"
            min="0" 
            max="150"
            class="age-number"
          >
          <select 
            id="ageUnit" 
            value={$patientData.ageUnit || 'years'}
            on:change={(e) => handleFieldChange('ageUnit', e.target.value)}
            class="age-unit"
          >
            <option value="days">Days</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </select>
        </div>
      </div>
    </div>
  </div>
  
  <div class="form-section">
    <h3>Study Information</h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="examType">Modality *</label>
        <select 
          id="examType" 
          value={$patientData.examType} 
          on:change={handleExamTypeChange}
          class:error={validationErrors.some(e => e.includes('modality'))}
        >
          {#each examTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label for="examSubtype">Body Region *</label>
        <select 
          id="examSubtype" 
          value={$patientData.examSubtype} 
          on:change={handleExamSubtypeChange}
          disabled={!$patientData.examType}
          class:error={validationErrors.some(e => e.includes('region'))}
        >
          {#each currentSubtypes as subtype}
            <option value={subtype.value}>{subtype.label}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label for="priority">Priority</label>
        <select 
          id="priority" 
          value={$patientData.priority || 'ROUTINE'}
          on:change={(e) => handleFieldChange('priority', e.target.value)}
        >
          <option value="ROUTINE">Routine</option>
          <option value="URGENT">Urgent</option>
          <option value="STAT">STAT</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="studyDate">Study Date</label>
        <input 
          type="date" 
          id="studyDate" 
          value={$patientData.studyDate}
          on:input={(e) => handleFieldChange('studyDate', e.target.value)}
        >
      </div>
      
      <div class="form-group">
        <label for="referringPhysician">Referring Physician</label>
        <input 
          type="text" 
          id="referringPhysician" 
          value={$patientData.referringPhysician}
          on:input={(e) => handleFieldChange('referringPhysician', e.target.value)}
          placeholder="Dr. Name"
        >
      </div>
      
      {#if $currentUser?.designation === 'Resident'}
      <div class="form-group">
        <label for="specialistName">Specialist Name *</label>
        <input 
          type="text" 
          id="specialistName" 
          value={$patientData.specialistName}
          on:input={(e) => handleFieldChange('specialistName', e.target.value)}
          placeholder="Attending physician name"
          class:error={validationErrors.some(e => e.includes('Specialist'))}
        >
      </div>
      
      <div class="form-group">
        <label for="specialistDesignation">Specialist Title</label>
        <select 
          id="specialistDesignation" 
          value={$patientData.specialistDesignation}
          on:change={(e) => handleFieldChange('specialistDesignation', e.target.value)}
        >
          <option value="Radiologist">Radiologist</option>
          <option value="Consultant Radiologist">Consultant Radiologist</option>
          <option value="Senior Radiologist">Senior Radiologist</option>
          <option value="Attending Physician">Attending Physician</option>
        </select>
      </div>
      {/if}
      
      <div class="form-group full-width">
        <label for="indication">Clinical Indication</label>
        <textarea 
          id="indication" 
          value={$patientData.indication}
          on:input={(e) => handleFieldChange('indication', e.target.value)}
          placeholder="Reason for study, clinical history..."
          rows="3"
        ></textarea>
      </div>
    </div>
  </div>

  {#if validationErrors.length > 0}
    <div class="validation-errors">
      <ul>
        {#each validationErrors as error}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if submitError}
    <div class="validation-errors">
      <ul>
        <li>{submitError}</li>
      </ul>
    </div>
  {/if}

  <div class="form-actions">
    <button class="btn btn-secondary" on:click={handleCancel} disabled={isSubmitting}>
      Cancel
    </button>
    <button class="btn btn-primary" on:click={handleStartReport} disabled={isSubmitting}>
      {#if isSubmitting}
        {isExistingReport ? 'Saving...' : 'Creating...'}
      {:else}
        {isExistingReport ? 'Save & Continue' : 'Start Report'}
      {/if}
    </button>
  </div>
</div>

{#if showCustomModal}
<div class="modal-backdrop" on:click={() => showCustomModal = false}>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <h3>Custom Entry</h3>
      <button class="modal-close" on:click={() => showCustomModal = false}>×</button>
    </div>
    
    <div class="modal-body">
      {#if $patientData.examType === 'custom'}
      <div class="form-group">
        <label for="customModality">Custom Modality</label>
        <input 
          id="customModality" 
          type="text" 
          bind:value={customModality} 
          placeholder="Enter custom modality"
          autofocus
        >
      </div>
      {/if}
      
      {#if $patientData.examSubtype === 'custom'}
      <div class="form-group">
        <label for="customRegion">Custom Body Region</label>
        <input 
          id="customRegion" 
          type="text" 
          bind:value={customRegion} 
          placeholder="Enter custom body region (e.g., Lumbosacral, Ankle)"
          autofocus={$patientData.examType !== 'custom'}
        >
      </div>
      
      <div class="form-group">
        <label>Select Modalities (where this region should appear) *</label>
        <div class="modality-checkboxes">
          {#each availableModalities as modality}
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={selectedModalities.includes(modality.value)}
              on:change={() => toggleModality(modality.value)}
            >
            <span>{modality.label}</span>
          </label>
          {/each}
        </div>
        <small class="help-text">Check all modalities where "{customRegion || 'this region'}" should appear</small>
      </div>
      {/if}
    </div>
    
    <div class="modal-actions">
      <button class="btn btn-secondary" on:click={() => showCustomModal = false}>
        Cancel
      </button>
      <button class="btn btn-primary" on:click={saveCustomSelections}>
        Save
      </button>
    </div>
  </div>
</div>
{/if}

<style>
  .patient-header {
    background: var(--color-surface, #ffffff);
    padding: 0;
  }
  
  .form-section {
    margin-bottom: 1.5rem;
  }
  
  .form-section:last-of-type {
    margin-bottom: 0;
  }
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border, #e2e8f0);
  }
  
  .section-header h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text-primary, #1e293b);
    font-weight: 600;
  }
  
  .report-id-badge {
    background: #1e3a5f;
    color: #93c5fd;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  .form-section h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    color: var(--color-text-primary, #1e293b);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border, #e2e8f0);
    font-weight: 600;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  
  .form-group.full-width {
    grid-column: 1 / -1;
  }
  
  .form-group label {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text-primary, #374151);
  }
  
  .form-group input, 
  .form-group select,
  .form-group textarea {
    padding: 0.625rem;
    border: 2px solid var(--color-border, #e2e8f0);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1e293b);
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }
  
  .form-group textarea {
    resize: vertical;
    min-height: 80px;
  }

  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: var(--color-text-muted, #94a3b8);
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--color-border-focus, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group input:disabled,
  .form-group select:disabled {
    background: var(--color-surface-secondary, #f1f5f9);
    color: var(--color-text-secondary, #64748b);
    cursor: not-allowed;
  }

  .form-group input.error,
  .form-group select.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .age-input-group {
    display: flex;
    gap: 0.5rem;
  }

  .age-input-group .age-number {
    flex: 2;
  }

  .age-input-group .age-unit {
    flex: 1;
    min-width: 90px;
  }

  .validation-errors {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
  }

  .validation-errors ul {
    margin: 0;
    padding-left: 1.25rem;
    color: #dc2626;
    font-size: 0.875rem;
  }

  .validation-errors li {
    margin-bottom: 0.25rem;
  }
  
  .validation-errors li:last-child {
    margin-bottom: 0;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem 0 0;
    margin-top: 1.5rem;
    border-top: 1px solid var(--color-border, #e2e8f0);
  }
  
  .btn {
    padding: 0.5rem 1.5rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.15s ease-in-out;
    min-width: 120px;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
  }
  
  .btn-primary:active {
    transform: translateY(0);
  }
  
  .btn-secondary {
    background: var(--color-surface-elevated, #ffffff);
    color: var(--color-text-primary, #1e293b);
    border: 1px solid var(--color-border, #e2e8f0);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-hover, #f8fafc);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.15s ease-out;
  }
  
  .modal {
    background: var(--color-surface, #ffffff);
    border-radius: 0.75rem;
    min-width: 400px;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: slideIn 0.15s ease-out;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #e2e8f0);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary, #1e293b);
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-secondary, #475569);
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    transition: background-color 0.15s ease-in-out;
  }

  .modal-close:hover {
    background: var(--color-surface-hover, #f8fafc);
    color: var(--color-text-primary, #1e293b);
  }

  .modal-body {
    padding: 1.5rem;
  }
  
  /* Modality checkbox grid */
  .modality-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.15s ease;
  }

  .checkbox-label:hover {
    background: var(--color-surface-hover, #f8fafc);
  }

  .checkbox-label input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .checkbox-label span {
    font-size: 0.875rem;
    color: var(--color-text-primary, #1e293b);
  }

  .help-text {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted, #64748b);
    font-style: italic;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-surface-secondary, #f9fafb);
    border-radius: 0 0 0.75rem 0.75rem;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .form-group.full-width {
      grid-column: span 1;
    }
    
    .modal {
      width: 90%;
      max-width: 400px;
      margin: 1rem;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .btn {
      width: 100%;
    }
  }

  /* High-contrast text for all form inputs */
  .form-group input,
  .form-group select {
    color: var(--color-text-primary, #1e293b) !important;
  }

  /* Placeholder text styling */
  .form-group input::placeholder {
    color: var(--color-text-muted, #64748b);
    opacity: 1;
  }

  .form-group select option {
    background: var(--color-surface, #ffffff);
    color: var(--color-text-primary, #1e293b);
  }

  /* Date picker calendar icon - invert for dark theme */
  :global([data-theme="dark"]) .form-group input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }

  /* Dark theme overrides for custom modality/region modal */
  :global([data-theme="dark"]) .modal {
    background: #1e293b;
  }

  :global([data-theme="dark"]) .modal-header {
    border-color: #475569;
  }

  :global([data-theme="dark"]) .modal-header h3 {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .modal-close {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .modal-close:hover {
    background: #334155;
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .modal-body {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .modal-body label {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .modal-body input,
  :global([data-theme="dark"]) .modal-body select,
  :global([data-theme="dark"]) .modal-body textarea {
    background: #1e293b;
    border-color: #475569;
    color: #e2e8f0 !important;
  }

  :global([data-theme="dark"]) .modal-body input::placeholder {
    color: #64748b;
  }

  :global([data-theme="dark"]) .modal-body input:focus,
  :global([data-theme="dark"]) .modal-body select:focus,
  :global([data-theme="dark"]) .modal-body textarea:focus {
    border-color: #3b82f6;
  }

  :global([data-theme="dark"]) .checkbox-label {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .checkbox-label:hover {
    background: #334155;
  }

  :global([data-theme="dark"]) .checkbox-label span {
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .help-text {
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .modal-actions {
    background: #1e293b;
    border-color: #475569;
  }

  :global([data-theme="dark"]) .modal-body select option {
    background: #1e293b;
    color: #e2e8f0;
  }

  :global([data-theme="dark"]) .form-group input:disabled,
  :global([data-theme="dark"]) .form-group select:disabled {
    background: #334155;
    color: #94a3b8;
  }

  :global([data-theme="dark"]) .modality-checkboxes {
    background: #1e293b;
    border-color: #475569;
  }
</style>
