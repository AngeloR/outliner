import {KeyEventDefinition} from "./base";

export const z: KeyEventDefinition = {
  context: 'navigation',
  keys: ['z'],
  description: 'hide all children node of the current node',
  action: args => {
    const { cursor, api, outline } = args;
    // toggle collapse
    if(cursor.isNodeExpanded()) {
      cursor.collapse();
      outline.fold(cursor.getIdOfNode());
    }
    else if(cursor.isNodeCollapsed()) {
      cursor.expand();
      outline.unfold(cursor.getIdOfNode());
    }
    api.save(outline);

  }
}
