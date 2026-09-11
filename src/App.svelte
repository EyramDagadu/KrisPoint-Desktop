<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { currentReport, reports, macros, isDictating, activeTab, loadAppData, createNewReport } from './app.store';
  import { generatePDF } from './lib/utils';

  let recognition: any;
  let isCommandMode = false;
  let interimTranscript = '';

  // Initialize speech recognition
  onMount(async () => {
    await loadAppData();
    setupSpeechRecognition();
  });

  function setupSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        handleSpeechResult(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      isDictating.set(false);
    };
  }

  function handleSpeechResult(transcript: string) {
    if (transcript.toLowerCase().includes('narrative')) {
      handleVoiceCommand(transcript);
    } else {
      $currentReport = {
        ...$currentReport,
        [$activeTab]: $currentReport[$activeTab] + transcript + ' '
      };
    }
  }

  function handleVoiceCommand(transcript: string) {
    const command = transcript.toLowerCase().replace('narrative', '').trim();
    
    if (command.startsWith('macro')) {
      const macroName = command.replace('macro', '').trim();
      insertMacro(macroName);
    } else if (command.includes('new paragraph')) {
      insertText('\n\n');
    } else if (command.includes('finalize')) {
      finalizeReport();
    }
  }

  function toggleDictation() {
    if ($isDictating) {
      recognition.stop();
      isDictating.set(false);
    } else {
      recognition.start();
      isDictating.set(true);
    }
  }

  function insertMacro(name: string) {
    const macro = $macros.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (macro) {
      insertText(macro.text);
    }
  }

  function insertText(text: string) {
    $currentReport = {
      ...$currentReport,
      [$activeTab]: $currentReport[$activeTab] + text
    };
  }

  async function saveReport() {
    try {
      await invoke('save_report', { report: $currentReport });
      await loadAppData();
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  }

  async function finalizeReport() {
    $currentReport.status = 'finalized';
    await saveReport();
    
    try {
      const pdfBytes = await generatePDF($currentReport);
      const uint8Array = new Uint8Array(pdfBytes);
      await invoke('save_pdf', { 
        data: Array.from(uint8Array),
        fileName: `Report_${$currentReport.patient_name}_${new Date().getTime()}.pdf`
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  }

  function startNewReport() {
    $currentReport = createNewReport();
  }

  async function saveNewMacro(name: string, text: string) {
    if (name && text) {
      try {
        await invoke('save_macro', { macro: { name, text } });
        await loadAppData();
      } catch (error) {
        console.error('Failed to save macro:', error);
      }
    }
  }
</script>

<div class="app-container">
  <!-- Header -->
  <header>
    <h1>KrisPoint</h1>
    <div class="header-controls">
      <button on:click={startNewReport} class="btn-secondary">New Report</button>
      <button on:click={saveReport} class="btn-primary">Save</button>
    </div>
  </header>

  <!-- Main Content -->
  <div class="main-content">
    <!-- Patient Information -->
    <div class="patient-info">
      <input bind:value={$currentReport.patient_name} placeholder="Patient Name" />
      <input bind:value={$currentReport.patient_mrn} placeholder="MRN" />
      <input bind:value={$currentReport.accession_number} placeholder="Accession #" />
      <input bind:value={$currentReport.exam_type} placeholder="Exam Type" />
      <input bind:value={$currentReport.age} placeholder="Age" />
      <input bind:value={$currentReport.indication} placeholder="Indication" />
    </div>

    <!-- Editor Tabs -->
    <div class="editor-tabs">
      <button class:active={$activeTab === 'findings'} on:click={() => activeTab.set('findings')}>
        Findings
      </button>
      <button class:active={$activeTab === 'impression'} on:click={() => activeTab.set('impression')}>
        Impression
      </button>
    </div>

    <!-- Rich Text Editor -->
    <div class="editor-container">
      <textarea 
        bind:value={$currentReport[$activeTab]}
        placeholder={$activeTab === 'findings' ? 'Begin dictating findings...' : 'Begin dictating impression...'}
        class="rich-editor"
      />
      {#if interimTranscript}
        <div class="interim-transcript">{interimTranscript}</div>
      {/if}
    </div>

    <!-- Controls -->
    <div class="controls">
      <button on:click={toggleDictation} class:recording={$isDictating} class="btn-dictate">
        {$isDictating ? 'Stop Dictation' : 'Start Dictation'}
      </button>
      
      <select on:change={(e) => insertMacro(e.target.value)}>
        <option value="">Insert Macro</option>
        {#each $macros as macro}
          <option value={macro.name}>{macro.name}</option>
        {/each}
      </select>

      <button on:click={finalizeReport} class="btn-success">Finalize & Export PDF</button>
    </div>

    <!-- Macro Management -->
    <div class="macro-section">
      <h3>Manage Macros</h3>
      <div class="macro-inputs">
        <input bind:value={macroName} placeholder="Macro Name" />
        <textarea bind:value={macroText} placeholder="Macro Text"></textarea>
        <button on:click={() => saveNewMacro(macroName, macroText)}>Save Macro</button>
      </div>
    </div>
  </div>
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--color-background);
    color: var(--color-text);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: var(--color-surface);
    border-bottom: 1px solid #334155;
  }

  h1 {
    margin: 0;
    color: var(--color-primary);
    font-size: 1.8rem;
  }

  .header-controls {
    display: flex;
    gap: 1rem;
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
  }

  .patient-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  input, textarea {
    padding: 0.75rem;
    border: 1px solid #334155;
    border-radius: var(--border-radius);
    background: var(--color-surface);
    color: var(--color-text);
  }

  .editor-tabs {
    display: flex;
    margin-bottom: 1rem;
  }

  .editor-tabs button {
    padding: 0.75rem 1.5rem;
    border: none;
    background: #334155;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .editor-tabs button.active {
    background: var(--color-primary);
    color: white;
  }

  .editor-container {
    position: relative;
    margin-bottom: 2rem;
  }

  .rich-editor {
    width: 100%;
    height: 300px;
    resize: vertical;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    line-height: 1.6;
  }

  .interim-transcript {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 10px;
    padding: 0.5rem;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid var(--color-primary);
    border-radius: var(--border-radius);
    color: var(--color-primary);
  }

  .controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  .btn-secondary {
    background: #334155;
    color: var(--color-text);
  }

  .btn-secondary:hover {
    background: #475569;
  }

  .btn-success {
    background: var(--color-success);
    color: white;
  }

  .btn-success:hover {
    background: #16a34a;
  }

  .btn-dictate {
    background: #334155;
    color: var(--color-text);
  }

  .btn-dictate.recording {
    background: var(--color-danger);
    color: white;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  .macro-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #334155;
  }

  .macro-inputs {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: 1rem;
    align-items: start;
  }

  .macro-inputs textarea {
    height: 80px;
    resize: vertical;
  }
</style>