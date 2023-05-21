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

    const { outline, cursor } = args;
    const publisher = new HugoPublisher();
    publisher.bindEvents(outline, cursor);

    const selectedId = cursor.getIdOfNode();

    const node = outline.findNodeInTree(outline.data.tree, selectedId, async (node, parent) => {


      await publisher.publish(node);
    });

  }
}
