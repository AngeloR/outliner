import { KeyEventDefinition } from "./base";

export const h: KeyEventDefinition = {
  context: 'navigation',
  keys: ['h', 'left'],
  description: 'Move the cursor to the parent element of the current node',
  action: async args => {
    const { e, cursor } = args;
    const parent = cursor.get().parentElement;
    if (parent && parent.classList.contains('node')) {
      if (!e.shiftKey) {
        cursor.set(`#id-${parent.getAttribute('data-id')}`);
      }
    }
  }
}
