import { KeyEventDefinition } from "./base";

export const j: KeyEventDefinition = {
  context: 'navigation',
  keys: ['j', 'down'],
  description: 'Move the cursor to the next sibling of the current node',
  action: async args => {
    // move cursor down
    // if shift key is held, swap the node with its next sibling
    const el = args.cursor.get();
    const sibling = el.nextElementSibling as HTMLElement | null;

    if (sibling) {
      if (!args.e.shiftKey) {
        const isTasksContainer = el.id === 'id-tasks-aggregate';
        const inTasksAggregate = !!el.closest('#id-tasks-aggregate') && !isTasksContainer;
        const prefix = inTasksAggregate ? '#tasks-id-' : '#id-';
        args.cursor.set(`${prefix}${sibling.getAttribute('data-id')}`);
      }
    }

  }
}
