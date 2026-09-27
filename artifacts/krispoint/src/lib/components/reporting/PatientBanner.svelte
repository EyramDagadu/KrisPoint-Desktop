<!-- src/lib/components/reporting/PatientBanner.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { formatModality, formatBodyPart } from '../../utils/formatters.js';
  
  export let patient;
  
  const dispatch = createEventDispatcher();
  
  let showFullDetails = false;
  
  $: displayPatient = {
    name: patient.name || '',
    age: patient.age || '',
    gender: patient.gender || '',
    modality: formatModality(patient.examType || patient.modality) || '',
    bodyPart: formatBodyPart(patient.examSubtype || patient.bodyPart) || '',
    studyDate: patient.studyDate || new Date().toLocaleDateString(),
    mrn: patient.mrn || '',
    hospitalNumber: patient.mrn || patient.hospitalNumber || '',
    clinicalHistory: patient.indication || patient.clinicalHistory || ''
  };
</script>

<div class="patient-banner">
  <div class="banner-content">
    <div class="patient-info">
      <div class="patient-name-row">
        <span class="patient-name">{displayPatient.name || 'New Patient'}</span>
        <span class="patient-details">
          {displayPatient.age || '--'}/{displayPatient.gender || '--'} • 
          {displayPatient.modality || 'Unknown'} • 
          {displayPatient.bodyPart || 'Unknown'}
        </span>
      </div>
      <div class="study-info">
        <span class="hospital-number">Hospital No: {displayPatient.hospitalNumber || '--'}</span>
        <span class="study-date">{displayPatient.studyDate}</span>
      </div>
      {#if displayPatient.clinicalHistory || displayPatient.mrn}
        <button class="details-toggle" type="button" aria-expanded={showFullDetails} on:click={() => showFullDetails = !showFullDetails}>
          {showFullDetails ? 'Hide clinical context' : 'Clinical context'}
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" class:expanded={showFullDetails}><path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      {/if}
    </div>
    
    <div class="banner-actions">
      <button class="btn btn-outline" on:click={() => dispatch('editPatient')}>
        Edit Patient
      </button>
      <button class="btn btn-outline" on:click={() => dispatch('newReport')}>
        New Report
      </button>
    </div>
  </div>
  
  {#if showFullDetails}
    <div class="patient-details-expanded">
      <div class="detail-row">
        <span class="label">MRN:</span>
        <span class="value">{displayPatient.mrn || 'Not provided'}</span>
      </div>
      <div class="detail-row">
        <span class="label">Clinical History:</span>
        <span class="value">{displayPatient.clinicalHistory || 'Not provided'}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .patient-banner {
    background: var(--color-surface, #fff);
    color: var(--color-text-primary, #1e293b);
    padding: .9rem 1.25rem;
    border-bottom: 1px solid var(--color-border, #dbe2ea);
  }
  
  .banner-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.25rem;
  }
  
  .patient-info {
    flex: 1;
    min-width: 0;
  }
  
  .patient-name-row {
    display: flex;
    align-items: center;
    gap: .8rem;
    margin-bottom: 0.25rem;
  }
  
  .patient-name {
    color: var(--color-text-primary, #1e293b);
    font-size: 1.15rem;
    font-weight: 750;
    letter-spacing: -.02em;
    white-space: normal;
  }
  
  .patient-details {
    font-size: 0.9rem;
    color: var(--color-text-secondary, #475569);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .study-info {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary, #64748b);
  }
  
  .banner-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  .btn {
    padding: 0.4rem 0.75rem;
    border-radius: 0.45rem;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.85rem;
    border: 1px solid var(--color-border, #cbd5e1);
    background: var(--color-surface, #fff);
    color: var(--color-text-primary, #334155);
    transition: all 0.2s;
  }
  
  .btn:hover {
    background: var(--color-surface-hover, #f1f5f9);
    border-color: var(--color-primary, #3b82f6);
  }
  
  .patient-details-expanded {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border, #dbe2ea);
    font-size: 0.85rem;
  }
  
  .detail-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }
  
  .label {
    font-weight: 500;
    min-width: 100px;
    color: var(--color-text-secondary, #64748b);
  }
  
  .value {
    color: var(--color-text-primary, #334155);
  }

  .details-toggle {
    display: inline-flex;
    align-items: center;
    gap: .25rem;
    margin-top: .35rem;
    padding: .15rem 0;
    border: 0;
    background: none;
    color: var(--color-primary, #2563eb);
    font: inherit;
    font-size: .78rem;
    font-weight: 650;
    cursor: pointer;
  }
  .details-toggle svg { width: 1rem; height: 1rem; transition: transform .15s ease; }
  .details-toggle svg.expanded { transform: rotate(180deg); }
  :global(:focus-visible) { outline: 3px solid var(--color-primary, #3b82f6); outline-offset: 2px; }
  
  @media (max-width: 768px) {
    .patient-banner { padding: .8rem; }
    .banner-content {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    
    .patient-name-row {
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 0.25rem;
    }
    
    .study-info {
      flex-wrap: wrap;
      gap: .25rem .9rem;
    }
    
    .banner-actions {
      justify-content: flex-start;
    }
  }
  @media (max-width: 420px) {
    .banner-actions { width: 100%; }
    .banner-actions .btn { flex: 1; }
    .patient-name-row { display: block; }
    .patient-details { display: block; margin-top: .25rem; white-space: normal; }
  }
</style>