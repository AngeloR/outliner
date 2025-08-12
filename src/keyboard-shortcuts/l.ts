import { KeyEventDefinition } from "./base";

export const l: KeyEventDefinition = {
  context: 'navigation',
  keys: ['l'],
  description: 'Move the cursor to the first child element of the current node',
  action: async args => {
    const { e, cursor } = args;
    if (!e.shiftKey) {
      if (cursor.isNodeCollapsed()) {
        return;
      }
      const children = cursor.get().querySelector('.node');
      if (children) {
        cursor.set(`#id-${children.getAttribute('data-id')}`);
      }
    }
  }
}
