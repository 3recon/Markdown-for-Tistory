import type { StorageDriver } from './storageDriver';
import type { PostIdentity, StoredPostSource } from '../shared/types/post';

import { createRootStore } from './rootStore';

const now = () => new Date().toISOString();

const createEmptyPostSource = (identity: PostIdentity): StoredPostSource => ({
  storageKey: identity.storageKey,
  postId: identity.postId,
  origin: identity.origin,
  pathname: identity.pathname,
  kind: identity.kind,
  source: identity.source,
  editorContextKey: identity.editorContextKey,
  aliases: [],
  markdown: '',
  createdAt: now(),
  lastUpdatedAt: now()
});

const hasAlias = (aliases: string[], value: string): boolean => aliases.includes(value);

const findExistingRecord = (
  records: Record<string, StoredPostSource>,
  identity: PostIdentity
): StoredPostSource | null => {
  const direct = records[identity.storageKey];
  if (direct) {
    return direct;
  }

  for (const record of Object.values(records)) {
    if (record.origin !== identity.origin) {
      continue;
    }

    if (record.postId && identity.postId && record.postId === identity.postId) {
      return record;
    }

    if (
      record.kind === 'draft' &&
      identity.kind === 'draft' &&
      record.editorContextKey === identity.editorContextKey
    ) {
      return record;
    }

    if (hasAlias(record.aliases, identity.storageKey)) {
      return record;
    }
  }

  return null;
};

const syncIdentityMetadata = (
  current: StoredPostSource,
  identity: PostIdentity
): StoredPostSource => {
  const aliases = new Set(current.aliases);

  if (current.storageKey !== identity.storageKey) {
    aliases.add(current.storageKey);
  }

  return {
    ...current,
    storageKey: identity.storageKey,
    postId: identity.postId ?? current.postId,
    pathname: identity.pathname,
    origin: identity.origin,
    kind: identity.kind,
    source: identity.source,
    editorContextKey: identity.editorContextKey,
    aliases: [...aliases]
  };
};

export const createPostSourceRepository = (driver: StorageDriver) => {
  const rootStore = createRootStore(driver);

  return {
    async ensurePostRecord(identity: PostIdentity): Promise<StoredPostSource> {
      const schema = await rootStore.read();
      const existing = findExistingRecord(schema.postSources, identity);

      if (existing) {
        const synced = syncIdentityMetadata(existing, identity);
        const metadataChanged =
          existing.storageKey !== synced.storageKey ||
          existing.postId !== synced.postId ||
          existing.pathname !== synced.pathname ||
          existing.kind !== synced.kind ||
          existing.source !== synced.source ||
          existing.editorContextKey !== synced.editorContextKey ||
          existing.aliases.length !== synced.aliases.length;

        if (metadataChanged) {
          delete schema.postSources[existing.storageKey];
          schema.postSources[synced.storageKey] = synced;
          await rootStore.write(schema);
        }

        return synced;
      }

      const created = createEmptyPostSource(identity);
      schema.postSources[identity.storageKey] = created;
      await rootStore.write(schema);
      return created;
    },

    async getPostSource(identity: PostIdentity): Promise<StoredPostSource | null> {
      const schema = await rootStore.read();
      return findExistingRecord(schema.postSources, identity);
    },

    async saveMarkdown(identity: PostIdentity, markdown: string): Promise<StoredPostSource> {
      const schema = await rootStore.read();
      const current = findExistingRecord(schema.postSources, identity) ?? createEmptyPostSource(identity);
      const updated: StoredPostSource = {
        ...syncIdentityMetadata(current, identity),
        markdown,
        lastUpdatedAt: now()
      };

      if (current.storageKey !== updated.storageKey) {
        delete schema.postSources[current.storageKey];
      }

      schema.postSources[identity.storageKey] = updated;
      await rootStore.write(schema);
      return updated;
    }
  };
};
