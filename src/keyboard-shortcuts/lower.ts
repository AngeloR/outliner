import { KeyEventDefinition } from "./base";

export const lower: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + l'],
  description: 'Lower the current node to be a child of the previous sibling node',
  action: async args => {
    const { e, outline, cursor, api } = args;
    if (e.shiftKey) {
      const res = outline.lowerNodeToChild(cursor.getIdOfNode());
      const html = await outline.renderNode(res.oldParentNode);

      if (outline.isTreeRoot(res.oldParentNode.id)) {
        cursor.get().parentElement.innerHTML = html;
      }
      else {
        cursor.get().parentElement.outerHTML = html;
      }
      cursor.set(`#id-${res.targetNode.id}`);
      api.save(outline);
    }
  }
}
