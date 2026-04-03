import type { StoredPostSource } from '../shared/types/post';
import type { ExtensionSettings } from '../shared/types/settings';
import type { TagPreset } from '../shared/types/tagPreset';

export const STORAGE_VERSION = 1;

export interface StorageSchema {
  version: number;
  postSources: Record<string, StoredPostSource>;
  settings: ExtensionSettings;
  tagPresets: Record<string, TagPreset>;
}
