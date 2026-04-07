import type { ExtensionSettings } from '../shared/types/settings';

export const STORAGE_VERSION = 1;

export interface StorageSchema {
  version: number;
  settings: ExtensionSettings;
}
