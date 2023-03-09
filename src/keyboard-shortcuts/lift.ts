import { KeyEventDefinition } from "./base";

export const lift: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + h'],
  description: 'Lift the current node to be a sibling of the parent node',
  action: args => {
    const {e, cursor, outline, api} = args;

    if(e.shiftKey) {
      if(outline.data.tree.children.map(n => n.id).includes(cursor.getIdOfNode())) {
        // if this is a top level item, we can't elevate any further
        return;
      }
      const res = outline.liftNodeToParent(cursor.getIdOfNode());

      const html = outline.renderNode(res.parentNode);

      if(outline.isTreeRoot(res.parentNode.id)) {
        cursor.get().parentElement.parentElement.innerHTML = html;
      }
      else {
        cursor.get().parentElement.parentElement.outerHTML = html;
      }

      cursor.set(`#id-${res.targetNode.id}`);
      api.save(outline);
    }
  }
}
