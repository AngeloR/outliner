import { KeyEventDefinition } from './base';

export const d: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + d'],
  description: 'Delete the current node',
  action: args => {
    const { e, outline, cursor, api } = args;
    // deleting a node requires d + shift
    if(!e.shiftKey) {
      return;
    }

    const res = outline.removeNode(cursor.getIdOfNode());
    const html = outline.renderNode(res.parentNode);
    // the previous sibling!
    const prevSibling = cursor.get().previousElementSibling;
    const nextSibling = cursor.get().nextElementSibling;
    if(outline.isTreeRoot(res.parentNode.id)) {
      cursor.get().parentElement.innerHTML = html;
    }
    else {
      cursor.get().parentElement.outerHTML = html;
    }

    if(prevSibling && prevSibling.getAttribute('data-id')) {
      cursor.set(`#id-${prevSibling.getAttribute('data-id')}`);
    }
    else if(nextSibling && nextSibling.getAttribute('data-id')) {
      cursor.set(`#id-${nextSibling.getAttribute('data-id')}`);
    }
    else {
      cursor.set(`#id-${res.parentNode.id}`);
    }

    api.save(outline);
    args.outline.renderNodeDetails(args.cursor.getIdOfNode());
  }
}
