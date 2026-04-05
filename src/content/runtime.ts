import type { EditorAdapter } from './editorAdapter';

import { isLikelyTistoryEditorPage } from './tistoryPostIdentity';
import { detectEditorAdapter } from './editorAdapter';
import { createModeControls } from './modeControls';
import { detectTitleAdapter } from './titleAdapter';
import { createPreviewPanel } from '../preview/previewPanel';
import { attachBidirectionalScrollSync } from '../preview/scrollSync';
import { createSettingsRepository } from '../storage/settingsRepository';
import { chromeLocalStorageDriver } from '../storage/storageDriver';

export const createExtensionBootstrap = () => {
  const settingsRepository = createSettingsRepository(chromeLocalStorageDriver);

  return {
    async mount() {
      if (!isLikelyTistoryEditorPage(window.location)) {
        return;
      }

      const detectedEditor = detectEditorAdapter(document);
      if (!detectedEditor) {
        console.info('[tistory-md] editor page detected but no supported editor element was found.');
        return;
      }

      let editor: EditorAdapter = detectedEditor;
      const settings = await settingsRepository.getSettings();
      const preview = createPreviewPanel();
      const title = detectTitleAdapter(document);
      let currentState = {
        previewEnabled: settings.previewEnabled
      };

      const syncPreview = (markdown: string) => {
        preview.setMarkdown(markdown);
      };

      const syncTitle = () => {
        preview.setTitle(title?.getValue() ?? '');
      };

      syncTitle();
      syncPreview(editor.getMarkdown());
      preview.setVisible(currentState.previewEnabled);

      const controls = createModeControls({
        initialState: currentState,
        onTogglePreview: async () => {
          currentState = {
            ...currentState,
            previewEnabled: !currentState.previewEnabled
          };

          preview.setVisible(currentState.previewEnabled);
          controls.setState(currentState);
          try {
            await settingsRepository.updateSettings({
              previewEnabled: currentState.previewEnabled
            });
          } catch (error) {
            if (isExtensionContextInvalidated(error)) {
              console.info('[tistory-md] skipped settings persistence because the extension context was invalidated.');
              return;
            }

            console.warn('[tistory-md] failed to persist preview settings.', error);
          }
        }
      });

      let scrollSync = attachBidirectionalScrollSync(
        {
          element: editor.scrollElement,
          onScroll: (listener) => editor.onScroll(listener)
        },
        {
          element: preview.body,
          onScroll: (listener) => {
            preview.body.addEventListener('scroll', listener, { passive: true });
            return () => preview.body.removeEventListener('scroll', listener);
          }
        }
      );
      let detachEditorInput = attachEditorInput(editor, () => {
        syncPreview(editor.getMarkdown());
      });

      const rebindEditor = (nextEditor = detectEditorAdapter(document)) => {
        if (!nextEditor) {
          return;
        }

        if (nextEditor.element === editor.element) {
          syncPreview(editor.getMarkdown());
          return;
        }

        detachEditorInput();
        scrollSync.destroy();
        editor = nextEditor;
        detachEditorInput = attachEditorInput(editor, () => {
          syncPreview(editor.getMarkdown());
        });
        scrollSync = attachBidirectionalScrollSync(
          {
            element: editor.scrollElement,
            onScroll: (listener) => editor.onScroll(listener)
          },
          {
            element: preview.body,
            onScroll: (listener) => {
              preview.body.addEventListener('scroll', listener, { passive: true });
              return () => preview.body.removeEventListener('scroll', listener);
            }
          }
        );
        syncPreview(editor.getMarkdown());
      };

      let refreshScheduled = false;
      const scheduleRefresh = () => {
        if (refreshScheduled) {
          return;
        }

        refreshScheduled = true;
        window.setTimeout(() => {
          refreshScheduled = false;
          rebindEditor();
        }, 0);
      };

      const editorObserver = new MutationObserver(() => {
        scheduleRefresh();
      });
      editorObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });

      document.addEventListener('change', scheduleRefresh, true);
      document.addEventListener('click', scheduleRefresh, true);

      const detachTitleInput = title?.onInput(syncTitle) ?? (() => undefined);

      console.info('[tistory-md] initialized editor integration');

      return () => {
        editorObserver.disconnect();
        document.removeEventListener('change', scheduleRefresh, true);
        document.removeEventListener('click', scheduleRefresh, true);
        detachEditorInput();
        detachTitleInput();
        scrollSync.destroy();
      };
    }
  };
};

const attachEditorInput = (
  editor: EditorAdapter,
  listener: () => void
) => {
  return editor.onInput(listener);
};

const isExtensionContextInvalidated = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return /Extension context invalidated/i.test(error.message);
};
