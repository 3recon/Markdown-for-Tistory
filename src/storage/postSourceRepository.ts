import type { StorageDriver } from './storageDriver';
import type { PostIdentity, StoredPostSource } from '../shared/types/post';

import { createRootStore } from './rootStore';

const now = () => new Date().toISOString();

const createEmptyPostSource = (identity: PostIdentity): StoredPostSource => ({
  storageKey: identity.storageKey,
  postId: identity.postId,
  origin: identity.origin,
  pathname: identity.pathname,
  markdown: '',
  lastUpdatedAt: now()
});

export const createPostSourceRepository = (driver: StorageDriver) => {
  const rootStore = createRootStore(driver);

  return {
    async ensurePostRecord(identity: PostIdentity): Promise<StoredPostSource> {
      const schema = await rootStore.read();
      const existing = schema.postSources[identity.storageKey];

      if (existing) {
        return existing;
      }

      const created = createEmptyPostSource(identity);
      schema.postSources[identity.storageKey] = created;
      await rootStore.write(schema);
      return created;
    },

    async getPostSource(identity: PostIdentity): Promise<StoredPostSource | null> {
      const schema = await rootStore.read();
      return schema.postSources[identity.storageKey] ?? null;
    },

    async saveMarkdown(identity: PostIdentity, markdown: string): Promise<StoredPostSource> {
      const schema = await rootStore.read();
      const current = schema.postSources[identity.storageKey] ?? createEmptyPostSource(identity);
      const updated: StoredPostSource = {
        ...current,
        postId: identity.postId,
        pathname: identity.pathname,
        origin: identity.origin,
        markdown,
        lastUpdatedAt: now()
      };

      schema.postSources[identity.storageKey] = updated;
      await rootStore.write(schema);
      return updated;
    }
  };
};
