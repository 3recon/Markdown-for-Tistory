import type { StorageSchema } from './schema';
import { defaultExtensionSettings } from '../shared/types/settings';
import { STORAGE_VERSION } from './schema';
import { ROOT_STORAGE_KEY } from './storageKeys';
import type { StorageDriver } from './storageDriver';

const createEmptySchema = (): StorageSchema => ({
  version: STORAGE_VERSION,
  settings: defaultExtensionSettings
});

export const createRootStore = (driver: StorageDriver) => {
  const read = async (): Promise<StorageSchema> => {
    const stored = await driver.get<StorageSchema>(ROOT_STORAGE_KEY);
    if (!stored) {
      return createEmptySchema();
    }

    return {
      version: stored.version ?? STORAGE_VERSION,
      settings: stored.settings ?? defaultExtensionSettings
    };
  };

  const write = async (schema: StorageSchema): Promise<void> => {
    await driver.set(ROOT_STORAGE_KEY, schema);
  };

  return {
    read,
    write
  };
};
