import type { EditorAdapter } from './editorAdapter';

import { isLikelyTistoryEditorPage } from './tistoryPostIdentity';
import { detectEditorAdapter } from './editorAdapter';
import { createModeControls, isMarkdownModeActive } from './modeControls';
import { detectTitleAdapter } from './titleAdapter';
import { createPreviewPanel } from '../preview/previewPanel';
import { attachBidirectionalScrollSync } from '../preview/scrollSync';

const REBIND_RETRY_DELAYS = [0, 80, 240, 600, 1400, 2800];

const attachEditorInput = (
  editor: EditorAdapter,
  listener: () => void
) => {
  return editor.onInput(listener);
};

export const createExtensionBootstrap = () => {
  return {
    async mount() {
      if (!isLikelyTistoryEditorPage(window.location)) {
        return;
      }

      let destroyInitialized: () => void = () => undefined;
      let initialized = false;
      let initScheduled = false;

      const initialize = (detectedEditor: EditorAdapter) => {
        let editor: EditorAdapter = detectedEditor;
        const preview = createPreviewPanel();
        const title = detectTitleAdapter(document);
        let currentState = {
          previewEnabled: false
        };

        const syncPreview = (markdown: string) => {
          preview.setMarkdown(markdown);
        };

        const syncTitle = () => {
          preview.setTitle(title?.getValue() ?? '');
        };

        const syncPreviewLayout = () => {
          preview.syncLayout(editor.scrollElement);
        };

        const syncModeVisibility = (controls: ReturnType<typeof createModeControls>) => {
          const markdownMode = isMarkdownModeActive();
          controls.setVisible(markdownMode);
          preview.setVisible(markdownMode && currentState.previewEnabled);
        };

        syncTitle();
        syncPreview(editor.getMarkdown());
        preview.setVisible(currentState.previewEnabled);
        syncPreviewLayout();

        const controls = createModeControls({
          initialState: currentState,
          onTogglePreview: () => {
            currentState = {
              ...currentState,
              previewEnabled: !currentState.previewEnabled
            };

            preview.setVisible(currentState.previewEnabled);
            controls.setState(currentState);
          }
        });
        controls.reposition();
        syncModeVisibility(controls);

        let scrollSync = attachBidirectionalScrollSync(
          {
            name: 'editor',
            element: editor.scrollElement,
            setScrollTop: (scrollTop) => editor.setScrollTop(scrollTop),
            onScroll: (listener) => editor.onScroll(listener)
          },
          {
            name: 'preview',
            element: preview.scrollElement,
            onScroll: (listener) => {
              preview.scrollElement.addEventListener('scroll', listener, { passive: true });
              return () => preview.scrollElement.removeEventListener('scroll', listener);
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
              name: 'editor',
              element: editor.scrollElement,
              setScrollTop: (scrollTop) => editor.setScrollTop(scrollTop),
              onScroll: (listener) => editor.onScroll(listener)
            },
            {
              name: 'preview',
              element: preview.scrollElement,
              onScroll: (listener) => {
                preview.scrollElement.addEventListener('scroll', listener, { passive: true });
                return () => preview.scrollElement.removeEventListener('scroll', listener);
              }
            }
          );
          syncPreview(editor.getMarkdown());
          syncPreviewLayout();
          controls.reposition();
          syncModeVisibility(controls);
        };

        let refreshScheduled = false;
        let refreshCycle = 0;
        const scheduleRefresh = () => {
          if (refreshScheduled) {
            return;
          }

          refreshScheduled = true;
          const cycle = ++refreshCycle;

          for (const delay of REBIND_RETRY_DELAYS) {
            window.setTimeout(() => {
              if (cycle !== refreshCycle) {
                return;
              }

              rebindEditor();
              controls.reposition();
              syncModeVisibility(controls);
            }, delay);
          }

          window.setTimeout(() => {
            if (cycle === refreshCycle) {
              refreshScheduled = false;
            }
          }, Math.max(...REBIND_RETRY_DELAYS) + 20);
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
        window.addEventListener('resize', syncPreviewLayout);

        const detachTitleInput = title?.onInput(syncTitle) ?? (() => undefined);

        return () => {
          editorObserver.disconnect();
          document.removeEventListener('change', scheduleRefresh, true);
          document.removeEventListener('click', scheduleRefresh, true);
          window.removeEventListener('resize', syncPreviewLayout);
          detachEditorInput();
          detachTitleInput();
          scrollSync.destroy();
        };
      };

      const tryInitialize = () => {
        if (initialized) {
          return;
        }

        const detectedEditor = detectEditorAdapter(document);
        if (!detectedEditor) {
          return;
        }

        initialized = true;
        destroyInitialized = initialize(detectedEditor);
      };

      const scheduleInitialize = () => {
        if (initialized || initScheduled) {
          return;
        }

        initScheduled = true;
        window.setTimeout(() => {
          initScheduled = false;
          tryInitialize();
        }, 0);
      };

      const bootstrapObserver = new MutationObserver(() => {
        scheduleInitialize();
      });
      bootstrapObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });

      document.addEventListener('change', scheduleInitialize, true);
      document.addEventListener('click', scheduleInitialize, true);

      tryInitialize();

      return () => {
        bootstrapObserver.disconnect();
        document.removeEventListener('change', scheduleInitialize, true);
        document.removeEventListener('click', scheduleInitialize, true);
        destroyInitialized();
      };
    }
  };
};
