import { KeyEventDefinition } from "./base";

export const archive: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + x', 'ctrl + x'],
  description: 'Mark a node as archived; ctrl+x also completes task',
  action: async args => {
    const { e, outline, cursor, api } = args;
    e.preventDefault();
    // toggle "strikethrough" of node
    cursor.get().classList.toggle('strikethrough');
    const node = outline.getContentNode(cursor.getIdOfNode());
    node.toggleArchiveStatus();

    if (node.task) {
      if (e.ctrlKey || node.archived) {
        node.markComplete();
      }
      else {
        node.markIncomplete();
      }
    }

    // re-render content to reflect completion checkbox
    const contentEl = cursor.get().querySelector('.nodeContent') as HTMLElement;
    contentEl.innerHTML = await outline.renderContent(cursor.getIdOfNode());

    api.saveContentNode(node);
    api.save(outline);

  }
}
