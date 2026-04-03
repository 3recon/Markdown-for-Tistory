import type { ExtensionSettings } from '../shared/types/settings';
import { defaultExtensionSettings } from '../shared/types/settings';
import { createRootStore } from './rootStore';
import type { StorageDriver } from './storageDriver';

export const createSettingsRepository = (driver: StorageDriver) => {
  const rootStore = createRootStore(driver);

  return {
    async getSettings(): Promise<ExtensionSettings> {
      const schema = await rootStore.read();
      return schema.settings;
    },

    async updateSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
      const schema = await rootStore.read();
      const nextSettings = {
        ...defaultExtensionSettings,
        ...schema.settings,
        ...patch
      };
      schema.settings = nextSettings;
      await rootStore.write(schema);
      return nextSettings;
    }
  };
};
