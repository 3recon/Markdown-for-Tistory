import type { EditorAdapter } from './editorAdapter';

import { isLikelyTistoryEditorPage } from './tistoryPostIdentity';
import { detectEditorAdapter } from './editorAdapter';
import { createModeControls } from './modeControls';
import { createTagPresetPanel } from './tagPresetPanel';
import { detectTagAdapter, parseTagText } from './tagAdapter';
import { detectTitleAdapter } from './titleAdapter';
import { createPreviewPanel } from '../preview/previewPanel';
import { attachBidirectionalScrollSync } from '../preview/scrollSync';
import { createSettingsRepository } from '../storage/settingsRepository';
import { createTagPresetRepository } from '../storage/tagPresetRepository';
import { chromeLocalStorageDriver } from '../storage/storageDriver';

export const createExtensionBootstrap = () => {
  const settingsRepository = createSettingsRepository(chromeLocalStorageDriver);
  const tagPresetRepository = createTagPresetRepository(chromeLocalStorageDriver);

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
      let tagAdapter = detectTagAdapter(document);
      const settings = await settingsRepository.getSettings();
      let presets = await tagPresetRepository.list();
      const preview = createPreviewPanel();
      const title = detectTitleAdapter(document);
      let currentState = {
        previewEnabled: settings.previewEnabled
      };
      let selectedPresetId: string | undefined;

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
      const tagPresetPanel = createTagPresetPanel({
        onLoadCurrentTags: () => {
          return tagAdapter?.getTags() ?? [];
        },
        onSavePreset: async (input) => {
          const name = input.name.trim();
          const tags = parseTagText(input.tagsText);
          if (!name || tags.length === 0) {
            return;
          }

          const saved = await tagPresetRepository.save({
            id: input.id,
            name,
            tags
          });

          selectedPresetId = saved.id;
          presets = await tagPresetRepository.list();
          syncTagPanel();
        },
        onApplyPreset: (id) => {
          if (!tagAdapter) {
            return;
          }

          const preset = presets.find((item) => item.id === id);
          if (!preset) {
            return;
          }

          selectedPresetId = preset.id;
          tagAdapter.setTags(preset.tags);
          syncTagPanel();
        },
        onEditPreset: (id) => {
          selectedPresetId = id;
        },
        onDeletePreset: async (id) => {
          await tagPresetRepository.remove(id);
          if (selectedPresetId === id) {
            selectedPresetId = undefined;
          }

          presets = await tagPresetRepository.list();
          syncTagPanel();
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
      let detachTagInput = tagAdapter?.onInput(() => {
        syncTagPanel();
      }) ?? (() => undefined);

      const syncTagPanel = () => {
        tagPresetPanel.setState({
          currentTags: tagAdapter?.getTags() ?? [],
          presets,
          selectedPresetId,
          tagTargetAvailable: Boolean(tagAdapter)
        });
      };

      syncTagPanel();

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

      const rebindTagAdapter = (nextTagAdapter = detectTagAdapter(document)) => {
        if (nextTagAdapter?.element === tagAdapter?.element) {
          syncTagPanel();
          return;
        }

        detachTagInput();
        tagAdapter = nextTagAdapter;
        detachTagInput = tagAdapter?.onInput(() => {
          syncTagPanel();
        }) ?? (() => undefined);
        syncTagPanel();
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
          rebindTagAdapter();
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
        detachTagInput();
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
