import { KeyEventDefinition } from "./base";

export const j: KeyEventDefinition = {
  context: 'navigation',
  keys: ['j'],
  description: 'Move the cursor to the next sibling of the current node',
  action: async args => {
    // move cursor down
    // if shift key is held, swap the node with its next sibling
    const sibling = args.cursor.get().nextElementSibling;

    if (sibling) {
      if (!args.e.shiftKey) {
        args.cursor.set(`#id-${sibling.getAttribute('data-id')}`);
      }
    }

  }
}
