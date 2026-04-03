import type { TagPreset } from '../shared/types/tagPreset';
import { createRootStore } from './rootStore';
import type { StorageDriver } from './storageDriver';

const now = () => new Date().toISOString();

export const createTagPresetRepository = (driver: StorageDriver) => {
  const rootStore = createRootStore(driver);

  return {
    async list(): Promise<TagPreset[]> {
      const schema = await rootStore.read();
      return Object.values(schema.tagPresets).sort((left, right) => left.name.localeCompare(right.name));
    },

    async save(input: { id?: string; name: string; tags: string[] }): Promise<TagPreset> {
      const schema = await rootStore.read();
      const id = input.id ?? crypto.randomUUID();
      const existing = schema.tagPresets[id];
      const timestamp = now();

      const preset: TagPreset = {
        id,
        name: input.name,
        tags: input.tags,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp
      };

      schema.tagPresets[id] = preset;
      await rootStore.write(schema);
      return preset;
    },

    async remove(id: string): Promise<boolean> {
      const schema = await rootStore.read();
      if (!schema.tagPresets[id]) {
        return false;
      }

      delete schema.tagPresets[id];
      await rootStore.write(schema);
      return true;
    }
  };
};
