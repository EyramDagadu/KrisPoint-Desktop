<script>
  // @ts-nocheck
  import { onDestroy } from 'svelte';
  import { hasFeature } from '../../stores/licenseStore.js';
  import { toastError } from '../../utils/toast.js';
  import { polishReport } from './aiPolishService.js';
  import { aiPolishDraft } from './aiPolishDraftStore.js';
  import { reportActions } from '../../stores/reportStore.js';
  import { settingsService } from '../../services/SettingsService.js';
  import { isSoloEdition } from '../../config/edition.js';

  export let reportContent = '';
  export let indication = '';
  export let modality = '';
  export let bodyRegion = '';
  export let readOnly = false;
  export let activeTemplateId = null;
  export let activeTemplateName = null;

  export let onReportGenerated = null;
  let showModal = false;
  let loading = false;
  let templatesLoading = false;
  let templates = [];
  let selectedTemplate = null;
  let originalContent = '';
  let proposedContent = '';
  let warnings = [];
  let safetyMessage = '';
  let blocked = false;
  let errorMessage = '';
  let requestController;
  let proposalAction = 'polish';
  let lastUsedTemplate = null;

  function sameTemplate(template, id, name) {
    return Boolean(template) && (
      (id !== null && id !== undefined && String(template.id) === String(id)) ||
      (name && String(template.name || '').trim() === String(name).trim())
    );
  }

  function chooseTemplate(candidates) {
    const active = candidates.find(template => sameTemplate(template, activeTemplateId, activeTemplateName));
    if (active) return active;
    const recent = candidates.find(template => sameTemplate(
      template,
      lastUsedTemplate?.id ?? settingsService.settings?.reports?.lastUsedTemplateId,
      lastUsedTemplate?.name ?? settingsService.settings?.reports?.lastUsedTemplateName
    ));
    if (recent) return recent;
    const configuredDefault = settingsDefaultTemplate();
    const configured = candidates.find(template => sameTemplate(
      template,
      configuredDefault?.id,
      configuredDefault?.name
    ));
    return configured || candidates[0] || fallbackTemplate();
  }

  function settingsDefaultTemplate() {
    // The configured default is intentionally read-only here. It is not
    // committed to report state until a proposal is accepted.
    const value = settingsService.settings?.reports?.defaultTemplate;
    if (value && value !== 'blank') {
      return typeof value === 'object' ? value : { id: value, name: value };
    }
    return null;
  }

  const fallbackTemplate = () => ({
    id: null,
    identity: `fallback:${String(modality || 'general').toLowerCase()}:${String(bodyRegion || 'unspecified').toLowerCase()}`,
    name: `${modality || 'General'} · ${bodyRegion || 'General'} standard`,
    modality,
    bodyRegion,
    isFallback: true
  });

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeModality(value) {
    const normalized = normalize(value).replace(/[^a-z0-9]/g, '');
    const aliases = {
      us: 'ultrasound',
      ultrasound: 'ultrasound',
      ct: 'ct',
      computedtomography: 'ct',
      mri: 'mri',
      magneticresonanceimaging: 'mri',
      xray: 'xray',
      radiograph: 'xray',
      radiography: 'xray'
    };
    return aliases[normalized] || normalized;
  }

  function normalizeRegion(value) {
    const normalized = normalize(value).replace(/[^a-z0-9]/g, '');
    const aliases = {
      abdomen: 'abdomen',
      abdominal: 'abdomen',
      pelvis: 'pelvis',
      pelvic: 'pelvis',
      chest: 'chest',
      thoracic: 'chest',
      head: 'head',
      cranial: 'head'
    };
    return aliases[normalized] || normalized;
  }

  function matches(template) {
    const currentModality = normalizeModality(modality);
    const currentRegion = normalizeRegion(bodyRegion);
    const templateModality = normalizeModality(template.modality);
    const templateRegion = normalizeRegion(template.bodyRegion);
    const modalityMatch = !templateModality || templateModality === currentModality ||
      templateModality.includes(currentModality) || currentModality.includes(templateModality);
    const regionMatch = !templateRegion || templateRegion === currentRegion ||
      templateRegion.includes(currentRegion) || currentRegion.includes(templateRegion);
    return modalityMatch && regionMatch;
  }

  async function openPolish() {
    if (readOnly || !hasFeature('ai_polish')) return;
    if (settingsService.settings?.ai?.providerMode === 'disabled') {
      toastError('AI is disabled in settings');
      return;
    }
    if (!reportContent.trim()) {
      toastError('Add report content before polishing');
      return;
    }
    showModal = true;
    originalContent = reportContent;
    proposedContent = '';
    proposalAction = 'polish';
    warnings = [];
    safetyMessage = '';
    blocked = false;
    errorMessage = '';
    templatesLoading = true;
    try {
      const response = await fetch(
        isSoloEdition ? '/api/templates' : '/api/templates?scope=system',
        { credentials: 'include' }
      );
      const payload = await response.json().catch(() => ({}));
      const loadedTemplates = payload.templates || [];
      templates = loadedTemplates.filter(template =>
        matches(template) || sameTemplate(template, activeTemplateId, activeTemplateName)
      );
    } catch (error) {
      templates = [];
    } finally {
      templatesLoading = false;
    }
    selectedTemplate = chooseTemplate(templates);
    aiPolishDraft.set({ selectedTemplate, originalContent, proposedContent: '', blocked: false, warnings: [] });
  }

  function selectTemplate(event) {
    const identity = event.currentTarget.value;
    selectedTemplate = [...templates, fallbackTemplate()].find(
      template => String(template.id ?? template.identity) === identity
    ) || fallbackTemplate();
    proposedContent = '';
    warnings = [];
    blocked = false;
    errorMessage = '';
    aiPolishDraft.set({ selectedTemplate, originalContent, proposedContent: '', blocked: false, warnings: [] });
  }

  async function runPolish() {
    if (!selectedTemplate || loading) return;
    loading = true;
    errorMessage = '';
    requestController = new AbortController();
    try {
      const result = await polishReport({
        content: originalContent,
        indication,
        modality,
        bodyRegion,
        template: selectedTemplate,
        signal: requestController.signal,
        action: proposalAction
      });
      proposedContent = result.proposedContent;
      warnings = result.warnings;
      safetyMessage = result.safetyMessage;
      blocked = result.blocked;
      aiPolishDraft.set({ selectedTemplate, originalContent, proposedContent, blocked, warnings });
    } catch (error) {
      if (error.name !== 'AbortError') {
        errorMessage = error.message || 'Polish request could not be completed';
        warnings = error.warnings || [];
        blocked = Boolean(error.blocked);
        toastError(errorMessage);
      }
    } finally {
      loading = false;
      requestController = null;
    }
  }

  function cancelRequest() {
    requestController?.abort();
    loading = false;
  }

  function closeModal() {
    cancelRequest();
    showModal = false;
    proposedContent = '';
    aiPolishDraft.set({ selectedTemplate: null, originalContent: '', proposedContent: '', blocked: false, warnings: [] });
  }

  function acceptProposal() {
    if (loading || blocked || !proposedContent.trim() || readOnly) return;
    reportActions.setActiveTemplate(selectedTemplate);
    lastUsedTemplate = selectedTemplate;
    settingsService.saveSettings({
      reports: {
        ...settingsService.settings.reports,
        lastUsedTemplateId: selectedTemplate?.id ?? null,
        lastUsedTemplateName: selectedTemplate?.name ?? null
      }
    });
    if (onReportGenerated) onReportGenerated(proposedContent, proposalAction);
    closeModal();
  }

  onDestroy(() => requestController?.abort());
</script>

<button class="polish-trigger" on:click={openPolish} disabled={readOnly || !reportContent.trim() || !hasFeature('ai_polish') || settingsService.settings?.ai?.providerMode === 'disabled'} aria-label="Polish report">
  <span class="trigger-mark" aria-hidden="true">AI</span>
  <span>Polish</span>
</button>

{#if showModal}
  <div class="modal-backdrop" role="presentation" on:click|self={closeModal}>
    <div class="polish-modal" role="dialog" aria-modal="true" aria-labelledby="polish-title" tabindex="-1">
      <header class="modal-header">
        <div>
          <p class="eyebrow">Clinical drafting aid</p>
          <h2 id="polish-title">Review {proposalAction === 'impression' ? 'generated impression' : 'report polish'}</h2>
        </div>
        <button class="icon-button" on:click={closeModal} aria-label="Close polish review">×</button>
      </header>

      <div class="modal-body">
        <div class="template-row">
          <label for="polish-template">Template</label>
          {#if templatesLoading}
            <div class="skeleton" aria-label="Loading templates"></div>
          {:else}
            <select id="polish-template" value={String(selectedTemplate?.id ?? selectedTemplate?.identity ?? '')} on:change={selectTemplate}>
              {#each templates as template}
                <option value={String(template.id)}>{template.name}</option>
              {/each}
              <option value={fallbackTemplate().identity}>{fallbackTemplate().name}</option>
            </select>
          {/if}
        </div>
        <p class="template-note">Selected template is retained with this draft. Only the report author accepts changes.</p>

        {#if warnings.length || safetyMessage || errorMessage}
          <div class:blocked class="safety-panel" role="alert">
            <strong>{blocked ? 'Polish blocked' : 'Safety review'}</strong>
            {#if safetyMessage}<p>{safetyMessage}</p>{/if}
            {#if errorMessage}<p>{errorMessage}</p>{/if}
            {#each warnings as warning}<p>{typeof warning === 'string' ? warning : warning.message || warning.code}</p>{/each}
          </div>
        {/if}
        <div class="responsibility-note">
          <strong>Clinical responsibility remains with the reporting clinician.</strong>
          Verify every proposed statement against the images and clinical context before accepting.
        </div>

        {#if loading && !proposedContent}
          <div class="loading-card"><div class="skeleton line"></div><div class="skeleton line short"></div><p>Preparing a proposed revision…</p></div>
        {:else}
          <div class="review-grid">
            <article><h3>Original</h3><div class="report-copy">{originalContent}</div></article>
            <article class:empty={!proposedContent}><h3>Proposed</h3><div class="report-copy">{proposedContent || 'Run polish to review a proposed revision.'}</div></article>
          </div>
        {/if}
      </div>

      <footer class="modal-footer">
        {#if loading}
          <button class="button quiet" on:click={cancelRequest}>Cancel request</button>
        {:else if !proposedContent}
          <button class="button quiet" on:click={closeModal}>Cancel</button>
          <button class="button quiet" on:click={() => { proposalAction = 'impression'; runPolish(); }} disabled={!selectedTemplate}>Generate impression</button>
          <button class="button primary" on:click={() => { proposalAction = 'polish'; runPolish(); }} disabled={!selectedTemplate}>Prepare polish proposal</button>
        {:else}
          <button class="button quiet" on:click={closeModal}>Reject</button>
          <button class="button primary" on:click={acceptProposal} disabled={blocked}>Accept proposal</button>
        {/if}
      </footer>
    </div>
  </div>
{/if}

<style>
  .polish-trigger { display:flex; align-items:center; gap:6px; border:1px solid rgba(156,178,193,.35); background:rgba(25,48,64,.72); color:#e8f1f3; border-radius:4px; padding:5px 9px; font:600 11px/1.1 ui-sans-serif,system-ui,sans-serif; letter-spacing:.03em; cursor:pointer; }
  .polish-trigger:hover:not(:disabled), .polish-trigger:focus-visible { background:#2c5963; outline:2px solid #9cd3cb; outline-offset:2px; }
  .polish-trigger:disabled { opacity:.4; cursor:not-allowed; }
  .trigger-mark { font:700 10px/1 ui-monospace,monospace; color:#9cd3cb; border:1px solid currentColor; padding:2px 3px; border-radius:2px; }
  .modal-backdrop { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:16px; background:rgba(18,32,40,.68); }
  .polish-modal { width:min(920px,100%); max-height:min(780px,94dvh); display:flex; flex-direction:column; overflow:hidden; border:1px solid #cbdadd; border-radius:10px; background:#f4f7f6; color:#17313b; box-shadow:0 24px 70px rgba(18,40,49,.28); }
  .modal-header,.modal-footer { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:16px 20px; background:#fbfcfb; border-bottom:1px solid #d8e2e2; }
  .modal-footer { justify-content:flex-end; border-top:1px solid #d8e2e2; border-bottom:0; }
  .eyebrow { margin:0 0 3px; color:#52757a; font:700 10px/1 ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; }
  h2,h3,p { margin-top:0; } h2 { margin-bottom:0; font:650 20px/1.2 ui-sans-serif,system-ui,sans-serif; } h3 { margin-bottom:9px; font:700 11px/1 ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase; color:#52757a; }
  .icon-button { border:0; background:none; font-size:25px; color:#52757a; cursor:pointer; }
  .modal-body { overflow:auto; padding:20px; } .template-row { display:flex; align-items:center; gap:12px; } label { font:700 11px ui-monospace,monospace; text-transform:uppercase; color:#52757a; } select { flex:1; max-width:500px; padding:9px 10px; border:1px solid #bdcecf; border-radius:5px; background:#fff; color:#17313b; font:500 13px ui-sans-serif,system-ui,sans-serif; }
  .template-note { margin:8px 0 16px 68px; color:#6a8185; font-size:12px; } .responsibility-note { margin:0 0 18px; padding:11px 13px; border-left:3px solid #d09a45; background:#fff8eb; color:#5b4932; font-size:12px; line-height:1.45; } .responsibility-note strong { display:block; margin-bottom:2px; }
  .review-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; } .review-grid article { min-width:0; padding:14px; border:1px solid #d4dfdf; border-radius:7px; background:#fff; } .review-grid article.empty { background:#f0f4f3; } .report-copy { min-height:170px; max-height:310px; overflow:auto; white-space:pre-wrap; font:13px/1.65 ui-sans-serif,system-ui,sans-serif; color:#263f47; }
  .safety-panel { margin:0 0 14px; padding:11px 13px; border:1px solid #dfbb77; border-radius:6px; background:#fff8e8; color:#674d25; font-size:12px; } .safety-panel.blocked { border-color:#c98787; background:#fff0f0; color:#713b3b; } .safety-panel p { margin:5px 0 0; }
  .button { padding:9px 14px; border-radius:5px; font:700 12px ui-sans-serif,system-ui,sans-serif; cursor:pointer; } .button.quiet { border:1px solid #bdcecf; background:#fff; color:#365860; } .button.primary { border:1px solid #285b62; background:#285b62; color:#fff; } .button:disabled { opacity:.45; cursor:not-allowed; }
  .loading-card { padding:26px 12px; text-align:center; color:#668086; } .skeleton { height:36px; border-radius:4px; background:linear-gradient(90deg,#dce6e5,#f4f7f6,#dce6e5); background-size:200% 100%; animation:shimmer 1.4s ease-in-out infinite; } .skeleton.line { width:100%; margin:8px 0; } .skeleton.short { width:62%; } @keyframes shimmer { from {background-position:200% 0} to {background-position:-200% 0} }
  @media (max-width:640px) { .modal-backdrop { padding:0; align-items:end; } .polish-modal { max-height:94dvh; border-radius:10px 10px 0 0; } .modal-header,.modal-footer,.modal-body { padding:14px; } .template-row { align-items:flex-start; flex-direction:column; gap:7px; } select { width:100%; max-width:none; } .template-note { margin-left:0; } .review-grid { grid-template-columns:1fr; } .review-grid article { min-height:150px; } .modal-footer { flex-wrap:wrap; } .button { flex:1; } }
</style>