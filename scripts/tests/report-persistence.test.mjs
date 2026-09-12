import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('report schemas retain exact active template identity', () => {
  for (const path of ['shared/schema.ts', 'shared/sqlite-schema.ts']) {
    const source = read(path);
    assert.match(source, /activeTemplateId:\s*(integer|text)\(/);
    assert.match(source, /activeTemplateName:\s*(varchar|text)\(/);
  }
  const sqlite = read('src/lib/server/sqlite.ts');
  assert.match(sqlite, /active_template_id/);
  assert.match(sqlite, /active_template_name/);
  const migration = read('drizzle/0001_active_template_identity.sql');
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "active_template_id"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "active_template_name"/);
});

test('report APIs and client store carry template identity on create, update, and load', () => {
  const route = read('src/routes/api/reports/+server.ts');
  assert.match(route, /activeTemplateId/);
  assert.match(route, /activeTemplateName/);
  assert.match(route, /updateData\.activeTemplateId/);
  assert.match(route, /updateData\.activeTemplateName/);

  const store = read('src/lib/stores/reportStore.js');
  assert.match(store, /activeTemplateId: currentReportData\.activeTemplateId/);
  assert.match(store, /activeTemplateName: currentReportData\.activeTemplateName/);
  assert.match(store, /activeTemplateId: dbReport\.activeTemplateId/);
  assert.match(store, /activeTemplateName: dbReport\.activeTemplateName/);
});

test('all template entry points select the persisted template before saving', () => {
  assert.match(read('src/lib/components/reporting/ToolsPanel.svelte'), /reportActions\.setActiveTemplate\(template\)/);
  assert.match(read('src/lib/services/EnhancedVoiceService.js'), /reportActions\.setActiveTemplate\(dbTemplate\)/);
  assert.match(read('src/routes/reporting/+page.svelte'), /reportActions\.setActiveTemplate\(template\)/);
  assert.match(read('src/routes/reporting/+page.svelte'), /reportActions\.setActiveTemplate\(dbTemplate\)/);
});

test('provider settings default to hosted and keep credentials out of browser storage', () => {
  const settings = read('src/lib/services/SettingsService.js');
  assert.match(settings, /providerMode:\s*'hosted'/);
  assert.match(settings, /sanitizeAiSettings/);
  assert.doesNotMatch(settings, /localStorage\.(?:setItem|getItem)\([^)]*(?:apiKey|api_key|providerKey|accessToken|secret)/i);

  const page = read('src/routes/settings/+page.svelte');
  assert.match(page, /value="hosted"/);
  assert.match(page, /value="disabled"/);
  assert.match(page, /Private Ollama/);
  assert.match(page, /Bring your own provider/);
  assert.match(page, /\/api\/ai\/status/);
});

test('proposal rejection remains non-destructive', () => {
  const component = read('src/lib/components/reporting/AIRefineButton.svelte');
  assert.match(component, /on:click=\{closeModal\}>Reject<\/button>/);
  const footerStart = component.indexOf('<footer class="modal-footer">');
  const footer = component.slice(footerStart, component.indexOf('</footer>', footerStart));
  assert.doesNotMatch(footer, /updateContent|setContent/);
});

test('AI template selection uses deterministic precedence without early commit', () => {
  const component = read('src/lib/components/reporting/AIRefineButton.svelte');
  assert.match(component, /sameTemplate\(template, activeTemplateId, activeTemplateName\)/);
  assert.match(component, /lastUsedTemplateId/);
  assert.match(component, /defaultTemplate/);
  assert.match(component, /return configured \|\| fallbackTemplate\(\)/);
  const acceptance = component.indexOf('function acceptProposal()');
  assert.equal(component.slice(0, acceptance).includes('reportActions.setActiveTemplate'), false);
});