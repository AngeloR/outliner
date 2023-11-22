import {KeyEventDefinition} from "./base";

export const tab: KeyEventDefinition = {
  context: 'navigation',
  keys: ['tab'],
  description: 'Add a new node as the child of the current node',
  action: args => {
    const { e, cursor, outline, api } = args;
    e.preventDefault();

    if(cursor.isNodeCollapsed()) {
      return;
    }

    const res = outline.createChildNode(cursor.getIdOfNode());
    const html = outline.renderNode(res.parentNode);

    cursor.get().outerHTML = html;

    cursor.set(`#id-${res.node.id}`);
    api.saveContentNode(res.node);
    api.save(outline);
    args.outline.renderNodeDetails(args.cursor.getIdOfNode());

  }
}
