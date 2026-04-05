import type { TagPreset } from '../shared/types/tagPreset';
import { stringifyTags } from './tagAdapter';

const PANEL_ID = 'tistory-md-tag-presets';

const panelStyles = `
  position: fixed;
  top: 72px;
  right: min(42vw + 40px, 720px);
  width: min(360px, calc(100vw - 48px));
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  color: #111827;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.12);
  z-index: 2147483001;
  backdrop-filter: blur(10px);
`;

const cardStyles = `
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const labelStyles = `
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
`;

const inputStyles = `
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
  background: #ffffff;
  color: #111827;
`;

const actionRowStyles = `
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const primaryButtonStyles = `
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: #111827;
  color: #fff7ed;
`;

const secondaryButtonStyles = `
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: #ffffff;
  color: #111827;
`;

const itemStyles = `
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  background: #f8fafc;
`;

export interface TagPresetPanelState {
  currentTags: string[];
  presets: TagPreset[];
  selectedPresetId?: string;
  tagTargetAvailable: boolean;
}

export interface TagPresetPanelController {
  setState(state: TagPresetPanelState): void;
}

export const createTagPresetPanel = (options: {
  onLoadCurrentTags(): string[];
  onSavePreset(input: { id?: string; name: string; tagsText: string }): void;
  onApplyPreset(id: string): void;
  onEditPreset(id: string): void;
  onDeletePreset(id: string): void;
}): TagPresetPanelController => {
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    existing.remove();
  }

  const root = document.createElement('section');
  root.id = PANEL_ID;
  root.setAttribute('style', panelStyles);

  const heading = document.createElement('div');
  heading.setAttribute('style', 'display: flex; flex-direction: column; gap: 4px;');

  const title = document.createElement('h2');
  title.textContent = 'Tag Presets';
  title.setAttribute('style', 'margin: 0; font-size: 14px; font-weight: 800;');

  const description = document.createElement('p');
  description.textContent = 'Save tag bundles and apply them to the editor.';
  description.setAttribute('style', 'margin: 0; font-size: 12px; color: #6b7280;');

  heading.append(title, description);

  const formCard = document.createElement('div');
  formCard.setAttribute('style', cardStyles);

  const nameLabel = document.createElement('label');
  nameLabel.setAttribute('style', labelStyles);
  nameLabel.textContent = 'Preset name';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Example: React article';
  nameInput.setAttribute('style', inputStyles);
  nameLabel.append(nameInput);

  const tagsLabel = document.createElement('label');
  tagsLabel.setAttribute('style', labelStyles);
  tagsLabel.textContent = 'Tags';

  const tagsInput = document.createElement('textarea');
  tagsInput.rows = 3;
  tagsInput.placeholder = 'react, typescript, frontend';
  tagsInput.setAttribute('style', `${inputStyles} resize: vertical; min-height: 84px;`);
  tagsLabel.append(tagsInput);

  const helper = document.createElement('p');
  helper.setAttribute('style', 'margin: 0; font-size: 11px; color: #6b7280;');

  const formActions = document.createElement('div');
  formActions.setAttribute('style', actionRowStyles);

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.textContent = 'Save preset';
  saveButton.setAttribute('style', primaryButtonStyles);

  const currentButton = document.createElement('button');
  currentButton.type = 'button';
  currentButton.textContent = 'Load current tags';
  currentButton.setAttribute('style', secondaryButtonStyles);

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.textContent = 'Clear';
  resetButton.setAttribute('style', secondaryButtonStyles);

  formActions.append(saveButton, currentButton, resetButton);
  formCard.append(nameLabel, tagsLabel, helper, formActions);

  const list = document.createElement('div');
  list.setAttribute('style', 'display: flex; flex-direction: column; gap: 10px;');

  root.append(heading, formCard, list);
  document.body.append(root);

  let selectedPresetId: string | undefined;

  const clearForm = () => {
    selectedPresetId = undefined;
    nameInput.value = '';
    tagsInput.value = '';
  };

  saveButton.addEventListener('click', () => {
    options.onSavePreset({
      id: selectedPresetId,
      name: nameInput.value.trim(),
      tagsText: tagsInput.value
    });
  });

  currentButton.addEventListener('click', () => {
    tagsInput.value = stringifyTags(options.onLoadCurrentTags());
  });

  resetButton.addEventListener('click', clearForm);

  const setState = (state: TagPresetPanelState) => {
    selectedPresetId = state.selectedPresetId;

    helper.textContent = state.tagTargetAvailable
      ? 'Comma-separated tags will be applied to the detected tag field.'
      : 'Tag input was not detected. You can still manage presets.';

    currentButton.disabled = !state.tagTargetAvailable;
    currentButton.style.opacity = state.tagTargetAvailable ? '1' : '0.5';
    currentButton.style.cursor = state.tagTargetAvailable ? 'pointer' : 'not-allowed';

    list.replaceChildren();

    if (state.presets.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No presets saved yet.';
      empty.setAttribute('style', 'margin: 0; font-size: 12px; color: #6b7280;');
      list.append(empty);
      return;
    }

    for (const preset of state.presets) {
      const item = document.createElement('article');
      item.setAttribute('style', itemStyles);

      const itemTitle = document.createElement('strong');
      itemTitle.textContent = preset.name;
      itemTitle.setAttribute('style', 'font-size: 13px;');

      const itemTags = document.createElement('p');
      itemTags.textContent = stringifyTags(preset.tags);
      itemTags.setAttribute('style', 'margin: 0; font-size: 12px; line-height: 1.6; color: #4b5563;');

      const actions = document.createElement('div');
      actions.setAttribute('style', actionRowStyles);

      const applyButton = document.createElement('button');
      applyButton.type = 'button';
      applyButton.textContent = 'Apply';
      applyButton.setAttribute('style', primaryButtonStyles);
      applyButton.disabled = !state.tagTargetAvailable;
      applyButton.style.opacity = state.tagTargetAvailable ? '1' : '0.5';
      applyButton.style.cursor = state.tagTargetAvailable ? 'pointer' : 'not-allowed';
      applyButton.addEventListener('click', () => {
        options.onApplyPreset(preset.id);
      });

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.textContent = 'Edit';
      editButton.setAttribute('style', secondaryButtonStyles);
      editButton.addEventListener('click', () => {
        nameInput.value = preset.name;
        tagsInput.value = stringifyTags(preset.tags);
        selectedPresetId = preset.id;
        options.onEditPreset(preset.id);
      });

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = 'Delete';
      deleteButton.setAttribute('style', secondaryButtonStyles);
      deleteButton.addEventListener('click', () => {
        if (selectedPresetId === preset.id) {
          clearForm();
        }

        options.onDeletePreset(preset.id);
      });

      actions.append(applyButton, editButton, deleteButton);
      item.append(itemTitle, itemTags, actions);
      list.append(item);
    }
  };

  return {
    setState
  };
};
