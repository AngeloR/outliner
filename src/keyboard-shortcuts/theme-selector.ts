import { KeyEventDefinition } from './base';
import { openThemeSelector } from '../modals/theme-selector';

export const themeSelector: KeyEventDefinition = {
  context: 'navigation',
  keys: [
    'ctrl + t'
  ],
  description: 'Open theme selector',
  action: async (args) => {
    openThemeSelector();
  }
}