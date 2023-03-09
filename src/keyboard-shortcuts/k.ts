import { KeyEventDefinition } from "./base";

export const k: KeyEventDefinition = {
  context: 'navigation',
  keys: ['k'],
  description: 'Move the cursor to the previous sibling of the current node',
  action: args => {
    const { cursor, e } = args;
    // move cursor up
    // if shift key is held, swap the node with its previous sibling
    const sibling = cursor.get().previousElementSibling;

    if(sibling && !sibling.classList.contains('nodeContent')) {
      if(!e.shiftKey) {
        cursor.set(`#id-${sibling.getAttribute('data-id')}`);
      }
    }
  }
}
