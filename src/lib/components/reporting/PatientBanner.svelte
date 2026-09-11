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
    background: #2c3e50;
    color: white;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #34495e;
  }
  
  .banner-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .patient-info {
    flex: 1;
    min-width: 0;
  }
  
  .patient-name-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.25rem;
  }
  
  .patient-name {
    font-size: 1.1rem;
    font-weight: 600;
    white-space: nowrap;
  }
  
  .patient-details {
    font-size: 0.9rem;
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .study-info {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    opacity: 0.8;
  }
  
  .banner-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  .btn {
    padding: 0.4rem 0.75rem;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.85rem;
    border: 1px solid rgba(255,255,255,0.3);
    background: transparent;
    color: white;
    transition: all 0.2s;
  }
  
  .btn:hover {
    background: rgba(255,255,255,0.1);
  }
  
  .patient-details-expanded {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255,255,255,0.1);
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
    opacity: 0.8;
  }
  
  .value {
    opacity: 0.9;
  }
  
  @media (max-width: 768px) {
    .banner-content {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    
    .patient-name-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
    
    .study-info {
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .banner-actions {
      justify-content: center;
    }
  }
</style>