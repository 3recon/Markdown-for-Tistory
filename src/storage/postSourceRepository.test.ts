import type { PostIdentity } from '../shared/types/post';
import type { StorageDriver } from './storageDriver';

import { describe, expect, it } from 'vitest';
import { createPostSourceRepository } from './postSourceRepository';

const createMemoryDriver = (): StorageDriver => {
  const store = new Map<string, unknown>();

  return {
    async get<T>(key: string) {
      return store.get(key) as T | undefined;
    },
    async set<T>(key: string, value: T) {
      store.set(key, value);
    }
  };
};

const identity: PostIdentity = {
  kind: 'post',
  origin: 'https://example.tistory.com',
  pathname: '/manage/post',
  postId: '101',
  source: 'query',
  editorContextKey: '/manage/post?postid=101',
  storageKey: 'https://example.tistory.com:post:101'
};

describe('createPostSourceRepository', () => {
  it('creates an empty record when missing', async () => {
    const repository = createPostSourceRepository(createMemoryDriver());

    const stored = await repository.ensurePostRecord(identity);
    expect(stored.markdown).toBe('');
    expect(stored.storageKey).toBe(identity.storageKey);
    expect(stored.aliases).toEqual([]);
  });

  it('saves markdown content for a post identity', async () => {
    const repository = createPostSourceRepository(createMemoryDriver());

    const stored = await repository.saveMarkdown(identity, '# Hello');
    expect(stored.markdown).toBe('# Hello');

    const reloaded = await repository.getPostSource(identity);
    expect(reloaded?.markdown).toBe('# Hello');
  });

  it('reattaches an existing post when the storage key changes but the post id stays the same', async () => {
    const repository = createPostSourceRepository(createMemoryDriver());
    await repository.saveMarkdown(identity, '# Hello');

    const movedIdentity: PostIdentity = {
      ...identity,
      pathname: '/manage/post/edit',
      source: 'dom',
      storageKey: 'https://example.tistory.com:post:edit-101'
    };

    const reattached = await repository.ensurePostRecord(movedIdentity);
    expect(reattached.markdown).toBe('# Hello');
    expect(reattached.storageKey).toBe(movedIdentity.storageKey);
    expect(reattached.aliases).toContain(identity.storageKey);
  });

  it('reattaches a draft using the editor context key', async () => {
    const repository = createPostSourceRepository(createMemoryDriver());
    const draftIdentity: PostIdentity = {
      kind: 'draft',
      origin: 'https://example.tistory.com',
      pathname: '/manage/newpost',
      postId: null,
      source: 'fallback',
      editorContextKey: '/manage/newpost',
      storageKey: 'https://example.tistory.com:draft:/manage/newpost'
    };

    await repository.saveMarkdown(draftIdentity, '# Draft');

    const reopenedDraft: PostIdentity = {
      ...draftIdentity,
      pathname: '/manage/newpost',
      storageKey: 'https://example.tistory.com:draft:/manage/newpost?from=resume'
    };

    const reloaded = await repository.getPostSource(reopenedDraft);
    expect(reloaded?.markdown).toBe('# Draft');
  });
});
