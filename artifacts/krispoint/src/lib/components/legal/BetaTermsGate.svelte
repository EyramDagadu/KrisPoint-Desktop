<script>
  import { onMount } from 'svelte';
  import { isSoloEdition } from '$lib/config/edition';
  import {
    BETA_TERMS_SECTIONS,
    BETA_TERMS_STORAGE_KEY,
    BETA_TERMS_VERSION
  } from '$lib/config/betaTerms.js';

  let ready = false;
  let accepted = false;
  let hasAccepted = !isSoloEdition;

  onMount(() => {
    if (isSoloEdition) {
      hasAccepted = localStorage.getItem(BETA_TERMS_STORAGE_KEY) === BETA_TERMS_VERSION;
    }
    ready = true;
  });

  function continueToKrisPoint() {
    if (!accepted) return;
    localStorage.setItem(BETA_TERMS_STORAGE_KEY, BETA_TERMS_VERSION);
    localStorage.setItem(
      `${BETA_TERMS_STORAGE_KEY}_accepted_at`,
      new Date().toISOString()
    );
    hasAccepted = true;
  }
</script>

{#if !ready}
  <div class="terms-loading" aria-label="Loading KrisPoint"></div>
{:else if isSoloEdition && !hasAccepted}
  <div class="terms-backdrop" role="presentation">
    <section
      class="terms-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-terms-title"
      aria-describedby="beta-terms-summary"
    >
      <header>
        <span class="eyebrow">KrisPoint Solo Beta</span>
        <h1 id="beta-terms-title">Beta Participation Terms</h1>
        <p id="beta-terms-summary">
          Please review and accept these terms before testing this pre-release build.
        </p>
      </header>

      <div class="notice">
        <strong>Important:</strong> Use fictitious or properly de-identified test data only.
        This beta must not be used for real patient care.
      </div>

      <div class="terms-content" tabindex="0">
        {#each BETA_TERMS_SECTIONS as section, index}
          <article>
            <h2>{index + 1}. {section.title}</h2>
            <p>{section.body}</p>
          </article>
        {/each}
      </div>

      <footer>
        <label class="acceptance">
          <input type="checkbox" bind:checked={accepted} />
          <span>
            I have read and accept the KrisPoint Solo Beta Participation Terms. I
            understand this is unsigned, pre-release software for testing only, that I
            must use fictitious or de-identified data, and that the final release is yet
            to come.
          </span>
        </label>
        <button type="button" disabled={!accepted} on:click={continueToKrisPoint}>
          Accept and continue
        </button>
        <small>Terms version {BETA_TERMS_VERSION}</small>
      </footer>
    </section>
  </div>
{:else}
  <slot />
{/if}

<style>
  .terms-loading {
    position: fixed;
    inset: 0;
    background: #101827;
  }

  .terms-backdrop {
    position: fixed;
    inset: 0;
    z-index: 20000;
    display: grid;
    place-items: center;
    padding: 1.25rem;
    background: rgba(11, 18, 32, 0.88);
    backdrop-filter: blur(8px);
  }

  .terms-dialog {
    width: min(760px, 100%);
    max-height: min(860px, calc(100vh - 2.5rem));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #dbe3ef;
    border-radius: 18px;
    background: #fff;
    color: #172033;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
  }

  header {
    padding: 1.6rem 1.75rem 1rem;
  }

  .eyebrow {
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0.35rem 0 0.4rem;
    font-size: 1.65rem;
  }

  header p,
  article p {
    margin: 0;
    color: #556176;
    line-height: 1.55;
  }

  .notice {
    margin: 0 1.75rem 1rem;
    padding: 0.9rem 1rem;
    border: 1px solid #f2c66d;
    border-radius: 10px;
    background: #fff8e6;
    color: #744b09;
    line-height: 1.45;
  }

  .terms-content {
    min-height: 0;
    margin: 0 1.75rem;
    padding: 0.2rem 1rem 0.2rem 0;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  article {
    padding: 0.75rem 0;
    border-bottom: 1px solid #e7ecf3;
  }

  article:last-child {
    border-bottom: 0;
  }

  h2 {
    margin: 0 0 0.25rem;
    color: #263247;
    font-size: 0.98rem;
  }

  footer {
    padding: 1.1rem 1.75rem 1.35rem;
    border-top: 1px solid #dfe5ee;
    background: #f8fafc;
  }

  .acceptance {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    color: #263247;
    font-size: 0.9rem;
    line-height: 1.45;
    cursor: pointer;
  }

  .acceptance input {
    width: 18px;
    height: 18px;
    margin-top: 0.12rem;
    flex: 0 0 auto;
    accent-color: #2563eb;
  }

  button {
    width: 100%;
    margin-top: 1rem;
    padding: 0.8rem 1rem;
    border: 0;
    border-radius: 9px;
    background: #2563eb;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #1d4ed8;
  }

  button:disabled {
    background: #aeb9ca;
    cursor: not-allowed;
  }

  small {
    display: block;
    margin-top: 0.65rem;
    color: #7a8598;
    text-align: center;
  }

  @media (max-width: 600px) {
    .terms-backdrop {
      padding: 0;
    }

    .terms-dialog {
      max-height: 100vh;
      min-height: 100vh;
      border: 0;
      border-radius: 0;
    }

    header,
    footer {
      padding-left: 1.1rem;
      padding-right: 1.1rem;
    }

    .notice,
    .terms-content {
      margin-left: 1.1rem;
      margin-right: 1.1rem;
    }
  }
</style>