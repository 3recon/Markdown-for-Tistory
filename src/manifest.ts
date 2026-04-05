import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Tistory Markdown Companion',
  version: '0.1.0',
  description: 'Adds a live Markdown preview and tag helpers to the Tistory editor.',
  permissions: ['storage'],
  host_permissions: ['*://*.tistory.com/*', '*://tistory.com/*'],
  content_scripts: [
    {
      matches: ['*://*.tistory.com/*', '*://tistory.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle'
    }
  ]
});
