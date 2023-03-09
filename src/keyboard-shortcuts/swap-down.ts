import {KeyEventDefinition} from "./base";

export const swapDown: KeyEventDefinition = {
  context: 'navigation',
  keys: [ 'shift + j' ],
  description: 'Swap the current node with the next sibling node',
  action: args => {
    // move cursor down
    // if shift key is held, swap the node with its next sibling
    const sibling = args.cursor.get().nextElementSibling;

    if(sibling) {
      if(args.e.shiftKey) {
        // swap this node with its previous sibling
        const res = args.outline.swapNodeWithNextSibling(args.cursor.getIdOfNode());
        const html = args.outline.renderNode(res.parentNode);

        if(args.outline.isTreeRoot(res.parentNode.id)) {
          args.cursor.get().parentElement.innerHTML = html;
        }
        else {
          args.cursor.get().parentElement.outerHTML = html;
        }

        args.cursor.set(`#id-${res.targetNode.id}`);
        args.api.save(args.outline);
      }
    }

  }
}
