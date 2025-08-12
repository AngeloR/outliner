import { KeyEventDefinition } from './base';
import { $ } from '../dom';

export const sidebarToggle: KeyEventDefinition = {
  context: 'navigation',
  keys: [
    'ctrl + ;'
  ],
  description: 'Toggle visibility of sidebar',
  action: async (args) => {
    $('#sidebar').classList.toggle('hidden');
  }
}
