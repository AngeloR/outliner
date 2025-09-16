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

        // Also update the original outline node's content and strikethrough state
        const originalNodes = Array.from(document.querySelectorAll(`.node[data-id="${nodeId}"]`)) as HTMLElement[];
        const original = originalNodes.find(n => !n.closest('#id-tasks-aggregate'));
        if (original) {
            const originalContentEl = original.querySelector('.nodeContent') as HTMLElement;
            if (originalContentEl) {
                originalContentEl.innerHTML = await outline.renderContent(nodeId);
            }
            const isCompletedTask = !!node.completionDate;
            if (node.isArchived() || isCompletedTask) {
                original.classList.add('strikethrough');
            }
            else {
                original.classList.remove('strikethrough');
            }
        }

        // Keep tasklist in sync for incremental updates without full render
        if (node.task) {
            outline.tasklist[nodeId] = node;
        }
        else {
            delete outline.tasklist[nodeId];
        }

        // Refresh Tasks aggregate at the top
        const tasksHtml = await outline.renderTasksFromTasklist();
        const tasksContainer = document.getElementById('id-tasks-aggregate');
        if (tasksHtml.length === 0) {
            if (tasksContainer) {
                tasksContainer.remove();
            }
        }
        else {
            if (tasksContainer) {
                tasksContainer.outerHTML = tasksHtml;
            }
            else {
                const root = document.querySelector('#outliner');
                if (root) {
                    root.insertAdjacentHTML('afterbegin', tasksHtml);
                }
            }
        }

        // Keep cursor where the user was interacting: tasks aggregate vs main outline
        const inTasksAggregate = !!cursor.get()?.closest('#id-tasks-aggregate');
        cursor.set(inTasksAggregate ? `#tasks-id-${nodeId}` : `#id-${nodeId}`);

        api.saveContentNode(node);
        api.save(outline);
    }
}

