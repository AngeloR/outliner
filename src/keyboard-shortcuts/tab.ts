import { KeyEventDefinition } from "./base";

export const tab: KeyEventDefinition = {
  context: 'navigation',
  keys: ['tab'],
  description: 'Add a new node as the child of the current node',
  action: async args => {
    const { e, cursor, outline, api } = args;
    e.preventDefault();

    const res = outline.createChildNode(cursor.getIdOfNode());
    const html = await outline.renderNode(res.parentNode);

    cursor.get().outerHTML = html;

    cursor.set(`#id-${res.node.id}`);
    api.saveContentNode(res.node);
    api.save(outline);

  }
}
