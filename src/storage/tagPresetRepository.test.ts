import { describe, expect, it } from 'vitest';

import { createTagPresetRepository } from './tagPresetRepository';
import type { StorageDriver } from './storageDriver';

const createMemoryDriver = (): StorageDriver => {
  const storage = new Map<string, unknown>();

  return {
    async get<T>(key: string) {
      return storage.get(key) as T | undefined;
    },
    async set<T>(key: string, value: T) {
      storage.set(key, value);
    }
  };
};

describe('createTagPresetRepository', () => {
  it('lists presets in name order after saving', async () => {
    const repository = createTagPresetRepository(createMemoryDriver());

    await repository.save({ name: 'Zeta', tags: ['zeta'] });
    await repository.save({ name: 'Alpha', tags: ['alpha'] });

    const presets = await repository.list();

    expect(presets.map((preset) => preset.name)).toEqual(['Alpha', 'Zeta']);
  });

  it('updates an existing preset without changing createdAt', async () => {
    const repository = createTagPresetRepository(createMemoryDriver());

    const initial = await repository.save({ name: 'React', tags: ['react'] });
    const updated = await repository.save({
      id: initial.id,
      name: 'React Advanced',
      tags: ['react', 'typescript']
    });

    expect(updated.createdAt).toBe(initial.createdAt);
    expect(updated.updatedAt >= initial.updatedAt).toBe(true);
    expect(updated.tags).toEqual(['react', 'typescript']);
  });

  it('removes saved presets', async () => {
    const repository = createTagPresetRepository(createMemoryDriver());
    const preset = await repository.save({ name: 'React', tags: ['react'] });

    await repository.remove(preset.id);

    expect(await repository.list()).toEqual([]);
  });
});
