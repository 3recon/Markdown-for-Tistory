import type { ExtensionSettings } from '../shared/types/settings';
import type { TagPreset } from '../shared/types/tagPreset';

export const STORAGE_VERSION = 1;

export interface StorageSchema {
  version: number;
  settings: ExtensionSettings;
  tagPresets: Record<string, TagPreset>;
}
