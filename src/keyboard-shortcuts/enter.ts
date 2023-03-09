import {KeyEventDefinition} from "./base";

export const enter: KeyEventDefinition = {
  context: 'navigation',
  keys: ['enter'],
  description: 'Add a new node as the sibling of the current node',
  action: args => {
    const { e, outline, cursor, api} = args;
    if(e.shiftKey) {
      return;
    }
    e.preventDefault();
    e.preventRepeat();

    const res = outline.createSiblingNode(cursor.getIdOfNode());

    const html = outline.renderNode(res.parentNode);
    if(outline.isTreeRoot(res.parentNode.id)) {
      cursor.get().parentElement.innerHTML = html;
    }
    else {
      cursor.get().parentElement.outerHTML = html;
    }

    cursor.set(`#id-${res.node.id}`);
    api.saveContentNode(res.node);
    api.save(outline);

  }
}
