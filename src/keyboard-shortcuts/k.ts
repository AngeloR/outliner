import { KeyEventDefinition } from "./base";

export const k: KeyEventDefinition = {
  context: 'navigation',
  keys: ['k'],
  description: 'Move the cursor to the previous sibling of the current node',
  action: async args => {
    const { cursor, e } = args;
    // move cursor up
    // if shift key is held, swap the node with its previous sibling
    const el = cursor.get();
    const sibling = el.previousElementSibling as HTMLElement | null;

    if (sibling && !sibling.classList.contains('nodeContent')) {
      if (!e.shiftKey) {
        const isTasksContainer = el.id === 'id-tasks-aggregate';
        const inTasksAggregate = !!el.closest('#id-tasks-aggregate') && !isTasksContainer;
        const prefix = inTasksAggregate ? '#tasks-id-' : '#id-';
        cursor.set(`${prefix}${sibling.getAttribute('data-id')}`);
      }
    }
  }
}
