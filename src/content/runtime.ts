import type { EditorAdapter } from './editorAdapter';

import { detectCurrentPostIdentity, isLikelyTistoryEditorPage } from './tistoryPostIdentity';
import { detectEditorAdapter } from './editorAdapter';
import { createModeControls } from './modeControls';
import { createPreviewPanel } from '../preview/previewPanel';
import { attachBidirectionalScrollSync } from '../preview/scrollSync';
import { createPostSourceRepository } from '../storage/postSourceRepository';
import { createSettingsRepository } from '../storage/settingsRepository';
import { chromeLocalStorageDriver } from '../storage/storageDriver';

export const createExtensionBootstrap = () => {
  const repository = createPostSourceRepository(chromeLocalStorageDriver);
  const settingsRepository = createSettingsRepository(chromeLocalStorageDriver);

  return {
    async mount() {
      if (!isLikelyTistoryEditorPage(window.location)) {
        return;
      }

      const identity = detectCurrentPostIdentity(window.location, document);

      if (!identity) {
        console.info('[tistory-md] editor page detected but no stable post identity was found yet.');
        return;
      }

      const editor = detectEditorAdapter(document);

      if (!editor) {
        console.info('[tistory-md] editor page detected but no supported editor element was found.');
        return;
      }

      const settings = await settingsRepository.getSettings();
      const record = await repository.ensurePostRecord(identity);
      const preview = createPreviewPanel();
      let currentState = {
        markdownModeEnabled: settings.markdownModeEnabled,
        previewEnabled: settings.previewEnabled
      };
      let lastMarkdown = record.markdown || editor.getMarkdown();

      const syncPreview = async (markdown: string) => {
        lastMarkdown = markdown;
        preview.setMarkdown(markdown);

        if (currentState.markdownModeEnabled) {
          await repository.saveMarkdown(identity, markdown);
        }
      };

      if (currentState.markdownModeEnabled && record.markdown) {
        editor.setMarkdown(record.markdown);
      }

      await syncPreview(lastMarkdown);
      preview.setVisible(currentState.markdownModeEnabled && currentState.previewEnabled);

      const controls = createModeControls({
        initialState: currentState,
        onToggleMarkdownMode: async () => {
          currentState = {
            ...currentState,
            markdownModeEnabled: !currentState.markdownModeEnabled
          };

          if (currentState.markdownModeEnabled) {
            const restored = await repository.getPostSource(identity);
            const markdown = restored?.markdown || editor.getMarkdown();
            editor.setMarkdown(markdown);
            await syncPreview(markdown);
          }

          preview.setVisible(currentState.markdownModeEnabled && currentState.previewEnabled);
          controls.setState(currentState);
          await settingsRepository.updateSettings({
            markdownModeEnabled: currentState.markdownModeEnabled
          });
        },
        onTogglePreview: async () => {
          if (!currentState.markdownModeEnabled) {
            return;
          }

          currentState = {
            ...currentState,
            previewEnabled: !currentState.previewEnabled
          };

          preview.setVisible(currentState.markdownModeEnabled && currentState.previewEnabled);
          controls.setState(currentState);
          await settingsRepository.updateSettings({
            previewEnabled: currentState.previewEnabled
          });
        }
      });

      const detachInput = wireEditorInput(editor, async () => {
        if (!currentState.markdownModeEnabled) {
          return;
        }

        await syncPreview(editor.getMarkdown());
      });

      const scrollSync = attachBidirectionalScrollSync(
        editor.element,
        preview.body
      );

      console.info('[tistory-md] initialized editor integration for', identity.storageKey);

      return () => {
        detachInput();
        scrollSync.destroy();
      };
    }
  };
};

const wireEditorInput = (editor: EditorAdapter, listener: () => void) => {
  return editor.onInput(listener);
};
