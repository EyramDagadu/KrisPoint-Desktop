import { build } from 'esbuild';
import { resolve } from 'node:path';

// Load the real services while isolating browser, store, and speech-engine dependencies.
// Command matching, async outcomes, API lookups, and transcript routing are not mocked.
const modules = {
  state: `
    export const state = {
      localMacros: [], errors: [], successes: [], inserted: [], templates: [], processorCalls: []
    };
  `,
  environment: `
    export let browser = false;
    export function setBrowser(value) { browser = value; }
  `,
  store: `
    import { state } from 'voice-test:state';
    export const reportData = {};
    export const uiState = {};
    export const reportActions = {
      setActiveTemplate: template => state.templates.push(template),
      updateSection: (section, text) => state.inserted.push({ text }),
      getSection: () => ''
    };
    export const uiActions = {
      getCurrentSection: () => 'findings',
      showErrorNotification: text => state.errors.push(text),
      showSuccessNotification: text => state.successes.push(text)
    };
  `,
  macros: `
    import { state } from 'voice-test:state';
    export const macroStore = state.localMacros;
  `,
  processor: `
    import { state } from 'voice-test:state';
    export const medicalTermsProcessor = {
      processText(text) {
        state.processorCalls.push(text);
        return 'rewritten: ' + text;
      }
    };
  `,
  whisper: 'export const whisperVoiceService = null;',
  storage: 'export const userStorageService = {};',
  svelte: 'export const get = value => value;'
};
const dependencyModules = {
  '$app/environment': 'environment',
  'svelte/store': 'svelte',
  'reportStore.js': 'store',
  'macroStore.js': 'macros',
  'MedicalTermsProcessor.js': 'processor',
  'WhisperVoiceService': 'whisper',
  'UserStorageService.js': 'storage'
};

const bundled = await build({
  stdin: {
    contents: `
      export { EnhancedVoiceService } from './artifacts/krispoint/src/lib/services/EnhancedVoiceService.js';
      export { voiceCommandService } from './artifacts/krispoint/src/lib/services/VoiceCommandService.js';
      export { state } from 'voice-test:state';
      export { setBrowser } from 'voice-test:environment';
    `,
    resolveDir: resolve(import.meta.dirname, '../../..')
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  logLevel: 'silent',
  plugins: [{
    name: 'voice-service-test-dependencies',
    setup(plugin) {
      plugin.onResolve({ filter: /.*/ }, args => {
        const key = args.path.startsWith('voice-test:')
          ? args.path.slice('voice-test:'.length)
          : dependencyModules[args.path] || dependencyModules[args.path.split('/').at(-1)];
        if (key) return { path: key, namespace: 'voice-test' };
      });
      plugin.onLoad({ filter: /.*/, namespace: 'voice-test' }, args => ({
        contents: modules[args.path], loader: 'js'
      }));
    }
  }]
});

export const harness = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);