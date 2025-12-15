import { KeyEventDefinition } from "./base";

export const l: KeyEventDefinition = {
  context: 'navigation',
  keys: ['l', 'right'],
  description: 'Move the cursor to the first child element of the current node',
  action: async args => {
    const { e, cursor } = args;
    if (!e.shiftKey) {
      if (cursor.isNodeCollapsed()) {
        return;
      }
      const el = cursor.get();
      const children = el.querySelector('.node') as HTMLElement | null;
      if (children) {
        const isTasksContainer = el.id === 'id-tasks-aggregate';
        const inTasksAggregate = !!el.closest('#id-tasks-aggregate') && !isTasksContainer;
        const prefix = inTasksAggregate || isTasksContainer ? '#tasks-id-' : '#id-';
        cursor.set(`${prefix}${children.getAttribute('data-id')}`);
      }
    }
  }
}
