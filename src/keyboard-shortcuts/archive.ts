import { KeyEventDefinition } from "./base";

export const archive: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + x'],
  description: 'Mark a node and all its children as "archived"',
  action: async args => {
    const { e, outline, cursor, api } = args;
    e.preventDefault();
    // toggle "strikethrough" of node
    cursor.get().classList.toggle('strikethrough');
    outline.getContentNode(cursor.getIdOfNode()).toggleArchiveStatus();
    api.saveContentNode(outline.getContentNode(cursor.getIdOfNode()));
    api.save(outline);

  }
}
