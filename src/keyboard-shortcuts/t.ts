import { KeyEventDefinition } from './base';

export const t: KeyEventDefinition = {
    context: 'navigation',
    keys: ['t'],
    description: 'Toggle current node as a task',
    action: async args => {
        const { e, cursor, outline, api } = args;
        e.preventDefault();

        const nodeId = cursor.getIdOfNode();
        const node = outline.getContentNode(nodeId);
        node.toggleTask();

        // Re-render just the content for this node to show/hide checkbox
        const contentEl = cursor.get().querySelector('.nodeContent') as HTMLElement;
        contentEl.innerHTML = await outline.renderContent(nodeId);

        api.saveContentNode(node);
        api.save(outline);
    }
}


