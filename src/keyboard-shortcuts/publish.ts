import { KeyEventDefinition } from "./base";
import { HugoPublisher } from "integrations/hugo-publisher";


export const publish: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + p'],
  description: 'Publish a node',
  action: async args => {
    if(!args.e.shiftKey) {
      return;
    }

    console.log('Instantiating hugo publisher');

    const { outline, cursor } = args;
    const publisher = new HugoPublisher(args.config);
    publisher.bindEvents(outline, cursor);

    const selectedId = cursor.getIdOfNode();

    const node = outline.findNodeInTree(outline.data.tree, selectedId, async (node, parent) => {
      const contentNode = outline.getContentNode(node.id);
      contentNode.publish();
      await publisher.publish(node);

      args.api.saveContentNode(contentNode);
    });

  }
}
