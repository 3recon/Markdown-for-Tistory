import { describe, expect, it } from 'vitest';

import { detectCurrentPostIdentity, isLikelyTistoryEditorPage } from './tistoryPostIdentity';

const createDocumentStub = (): Document =>
  ({
    querySelector: () => null
  }) as unknown as Document;

describe('isLikelyTistoryEditorPage', () => {
  it('detects a manage path', () => {
    const location = new URL('https://example.tistory.com/manage/post');
    expect(isLikelyTistoryEditorPage(location as unknown as Location)).toBe(true);
  });

  it('rejects a normal blog post path', () => {
    const location = new URL('https://example.tistory.com/123');
    expect(isLikelyTistoryEditorPage(location as unknown as Location)).toBe(false);
  });
});

describe('detectCurrentPostIdentity', () => {
  it('uses a query id when present', () => {
    const location = new URL('https://example.tistory.com/manage/post?postId=42');
    const documentRef = createDocumentStub();

    const identity = detectCurrentPostIdentity(location as unknown as Location, documentRef);
    expect(identity?.postId).toBe('42');
    expect(identity?.kind).toBe('post');
    expect(identity?.source).toBe('query');
  });

  it('falls back to draft identity when no post id exists', () => {
    const location = new URL('https://example.tistory.com/manage/newpost');
    const documentRef = createDocumentStub();

    const identity = detectCurrentPostIdentity(location as unknown as Location, documentRef);
    expect(identity?.kind).toBe('draft');
    expect(identity?.storageKey).toContain('draft');
    expect(identity?.editorContextKey).toContain('/manage/newpost');
    expect(identity?.source).toBe('fallback');
  });
});
