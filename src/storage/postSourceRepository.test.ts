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
  storageKey: 'https://example.tistory.com:post:101'
};

describe('createPostSourceRepository', () => {
  it('creates an empty record when missing', async () => {
    const repository = createPostSourceRepository(createMemoryDriver());

    const stored = await repository.ensurePostRecord(identity);
    expect(stored.markdown).toBe('');
    expect(stored.storageKey).toBe(identity.storageKey);
  });

  it('saves markdown content for a post identity', async () => {
    const repository = createPostSourceRepository(createMemoryDriver());

    const stored = await repository.saveMarkdown(identity, '# Hello');
    expect(stored.markdown).toBe('# Hello');

    const reloaded = await repository.getPostSource(identity);
    expect(reloaded?.markdown).toBe('# Hello');
  });
});
