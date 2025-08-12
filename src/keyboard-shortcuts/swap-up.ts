import { KeyEventDefinition } from "./base";

export const swapUp: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + k'],
  description: 'Swap the current node with the previous sibling node',
  action: async args => {
    const { cursor, outline, api, e } = args;
    // move cursor up
    // if shift key is held, swap the node with its previous sibling
    const sibling = cursor.get().previousElementSibling;

    if (sibling && !sibling.classList.contains('nodeContent')) {
      if (e.shiftKey) {
        // swap this node with its previous sibling
        const res = outline.swapNodeWithPreviousSibling(cursor.getIdOfNode());
        // re-render the parent node and display that!
        const html = await outline.renderNode(res.parentNode);

        if (outline.isTreeRoot(res.parentNode.id)) {
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
}
