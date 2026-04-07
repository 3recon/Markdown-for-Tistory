import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'markdown for tistory',
  version: '0.1.0',
  description: '티스토리에서 마크다운 미리보기 뷰 제공',
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  },
  host_permissions: ['*://*.tistory.com/*', '*://tistory.com/*'],
  content_scripts: [
    {
      matches: ['*://*.tistory.com/*', '*://tistory.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle'
    }
  ]
});
