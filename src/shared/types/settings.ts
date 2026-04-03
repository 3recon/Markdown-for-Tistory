export interface ExtensionSettings {
  markdownModeEnabled: boolean;
  previewEnabled: boolean;
}

export const defaultExtensionSettings: ExtensionSettings = {
  markdownModeEnabled: false,
  previewEnabled: true
};
