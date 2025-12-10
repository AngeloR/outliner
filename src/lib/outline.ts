import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { marked } from 'marked';
import { ContentNode } from './contentNode';
import * as markdownParsers from './parsers/md-parser';
import { DateTime } from 'luxon';
import { FindDate } from './parsers/date';
import { $ } from 'dom';

marked.use({
  renderer: {
    link: markdownParsers.link,
    codespan: markdownParsers.codespan as any
  }
});

const SupportedVersions = [
  '0.0.1'
];

export interface RawOutline {
  id: string;
  version: string;
  created: number;
  name: string;
  tree: OutlineTree;
  contentNodes: Record<string, ContentNode>
}

export interface OutlineTree {
  id: string;
  children: OutlineTree[]
  collapsed: boolean;
}

type DateStorage = {
  nodeId: string;
  date: DateTime;
}

type NodeID = string;
type IsoDate = string;

export class Outline {
  data: RawOutline;
  // tasklist
  tasklist: Record<NodeID, ContentNode>;
  // we use this format for enforce easy uniqueness
  dates: Record<IsoDate, Record<NodeID, DateStorage>>;

  constructor(outlineData: RawOutline) {
    this.tasklist = {};
    this.data = JSON.parse(JSON.stringify(outlineData)) as RawOutline;
    this.dates = {};

    if (!SupportedVersions.includes(this.data.version)) {
      throw new Error(`The version of outliner you have doesn't support opening this doc`);
    }

    this.data.contentNodes = _.keyBy(_.map(this.data.contentNodes, n => ContentNode.Create(n)), n => n.id);
  }

  isTreeRoot(id: string) {
    return this.data.id === id;
  }

  findNodeInTree(root: OutlineTree, id: string, action: (item: OutlineTree, parent: OutlineTree) => void, runState: boolean = false) {
    let run = runState;
    if (run) {
      return;
    }
    _.each(root.children, (childNode, idx) => {
      if (childNode.id === id) {
        action(childNode, root);
        run = true;
        return false;
      }
      else if (childNode.children) {
        this.findNodeInTree(childNode, id, action, run);
      }
    });
  }

  fold(nodeId: string) {
    this.findNodeInTree(this.data.tree, nodeId, item => {
      item.collapsed = true;
    });
  }

  unfold(nodeId: string) {
    this.findNodeInTree(this.data.tree, nodeId, item => {
      item.collapsed = false;
    });
  }

  flattenOutlineTreeChildren(tree: OutlineTree): string[] {
    return tree.children.map(node => node.id);
  }

  liftNodeToParent(nodeId: string) {
    let run = false;
    let targetNode: OutlineTree, parentNode: OutlineTree;
    this.findNodeInTree(this.data.tree, nodeId, (tNode, pNode) => {
      targetNode = tNode;
      this.findNodeInTree(this.data.tree, pNode.id, (originalParentNode, newParentNode) => {
        ;
        if (run) {
          return;
        }
        parentNode = newParentNode;
        run = true;

        const flatId = newParentNode.children.map(n => n.id);

        const originalNodePosition = originalParentNode.children.map(n => n.id).indexOf(targetNode.id);
        const newNodePosition = flatId.indexOf(originalParentNode.id);

        originalParentNode.children.splice(originalNodePosition, 1);

        newParentNode.children.splice(newNodePosition + 1, 0, targetNode);
      });
    });

    return {
      targetNode,
      parentNode
    }
  }

  lowerNodeToChild(nodeId: string) {
    let run = false;
    // find the previous sibling
    // make this node a child of the sibling node
    let targetNode: OutlineTree, newParentNode: OutlineTree, oldParentNode: OutlineTree;
    this.findNodeInTree(this.data.tree, nodeId, (tNode, pNode) => {
      if (run) {
        return;
      }
      run = true;
      targetNode = tNode;

      let idList = pNode.children.map(n => n.id);
      // there are no other siblings so we can't do anything
      if (idList.length === 1) {
        return;
      }

      const position = idList.indexOf(targetNode.id);
      const prevSiblingPosition = position - 1;

      pNode.children[prevSiblingPosition].children.splice(0, 0, targetNode);
      pNode.children.splice(position, 1);

      newParentNode = pNode.children[prevSiblingPosition];
      oldParentNode = pNode;
    });
    return {
      targetNode,
      newParentNode,
      oldParentNode
    }
  }

  swapNodeWithNextSibling(nodeId: string) {
    let targetNode: OutlineTree, parentNode: OutlineTree;
    this.findNodeInTree(this.data.tree, nodeId, (tNode, pNode) => {
      targetNode = tNode;
      parentNode = pNode;
      const flatId = parentNode.children.map(n => n.id);
      const nodePosition = flatId.indexOf(targetNode.id);

      if (nodePosition === (flatId.length - 1)) {
        // this is the last node in the list, there's nothing to swap
        return;
      }

      // remove the node from this point, and push it one later
      parentNode.children.splice(nodePosition, 1);
      parentNode.children.splice(nodePosition + 1, 0, targetNode);
    });

    return {
      targetNode,
      parentNode
    }
  }

  swapNodeWithPreviousSibling(nodeId: string) {
    let targetNode: OutlineTree, parentNode: OutlineTree;
    this.findNodeInTree(this.data.tree, nodeId, (tNode, pNode) => {
      targetNode = tNode;
      parentNode = pNode;
      const flatId = parentNode.children.map(n => n.id);
      const nodePosition = flatId.indexOf(targetNode.id);

      if (nodePosition === 0) {
        // this is the first node in the list, there's nothing to swap
        return;
      }

      // remove the node from this point, and push it one later
      parentNode.children.splice(nodePosition, 1);
      parentNode.children.splice(nodePosition - 1, 0, targetNode);
    });

    return {
      targetNode,
      parentNode
    }
  }

  createSiblingNode(targetNode: string, nodeData?: ContentNode) {
    const outlineNode: ContentNode = nodeData || new ContentNode(uuid());
    this.data.contentNodes[outlineNode.id] = outlineNode;

    let parentNode: OutlineTree;

    this.findNodeInTree(this.data.tree, targetNode, (node, parent) => {
      const position = parent.children.map(n => n.id).indexOf(targetNode);
      parent.children.splice(position + 1, 0, {
        id: outlineNode.id,
        collapsed: false,
        children: []
      });

      parentNode = parent;
    });

    return {
      node: outlineNode,
      parentNode
    }
  }

  createChildNode(currentNode: string, nodeId?: string) {
    const node: ContentNode = nodeId ? this.data.contentNodes[nodeId] : new ContentNode(uuid());

    if (!nodeId) {
      this.data.contentNodes[node.id] = node;
    }

    let parentNode: OutlineTree;

    this.findNodeInTree(this.data.tree, currentNode, (foundNode, parent) => {
      foundNode.children.unshift({
        id: node.id,
        children: [],
        collapsed: false
      });

      parentNode = foundNode;
    });

    return {
      node,
      parentNode
    }
  }

  removeNode(nodeId: string) {
    let run = false;
    let removedNode: OutlineTree, parentNode: OutlineTree;
    this.findNodeInTree(this.data.tree, nodeId, (tNode, pNode) => {
      if (run) {
        return;
      }
      run = true;
      removedNode = tNode;
      parentNode = pNode;

      let position = parentNode.children.map(n => n.id).indexOf(tNode.id);

      parentNode.children.splice(position, 1);
    });

    return {
      removedNode,
      parentNode
    }
  }

  updateContent(id: string, content: string) {
    if (!this.data.contentNodes[id]) {
      throw new Error('Invalid node');
    }

    this.data.contentNodes[id].content = content;
  }

  getContentNode(id: string) {
    if (!this.data.contentNodes[id]) {
      throw new Error(`Invalid Node ${id}`);
    }

    return this.data.contentNodes[id];
  }

  async renderContent(nodeId: string): Promise<string> {
    let node = this.getContentNode(nodeId)
    let content: string;
    switch (node.type) {
      case 'text':
        content = await marked.parse(node.content);

        // If this node is a task, prefix with a checkbox reflecting completion state
        if (node.task) {
          const checked = node.completionDate ? 'checked' : '';
          content = `<input type="checkbox" class="task-checkbox" ${checked} disabled> ${content}`;
        }

        // If completed, append a small completion badge with the date
        if (node.completionDate) {
          const completedAt = DateTime.fromMillis(node.completionDate);
          const dateText = completedAt.toLocaleString(DateTime.DATE_MED);
          const titleText = completedAt.toLocaleString(DateTime.DATETIME_FULL);
          content = `${content} <span class="completion-badge" title="${titleText}">Completed ${dateText}</span>`;
        }

        const now = DateTime.now();
        const foundDates = FindDate(node.content);
        if (foundDates.length) {
          foundDates.forEach(d => {
            // only deal with dates AFTER today
            if (now.startOf('day').toMillis() > d.toMillis()) {
              return;
            }
            if (!this.dates[d.toISODate()]) {
              this.dates[d.toISODate()] = {};
            }

            if (!this.dates[d.toISODate()][node.id]) {
              this.dates[d.toISODate()][node.id] = {
                date: d,
                nodeId: node.id
              };
            }
          });
        }
        break;
      default:
        content = node.content;
        break;
    }

    return content;
  }

  renderDates() {
    const sortedDates = _.sortBy(Object.keys(this.dates).map(d => DateTime.fromISO(d)), d => d.toSeconds());

    let html = sortedDates.map(dateKey => {
      return `<li><div class="date-header">${dateKey.toLocaleString({
        weekday: 'long',
        day: '2-digit',
        month: 'short'
      })}
      </div>
      <ol class="date-node-display">
      ${_.map(this.dates[dateKey.toISODate()], d => {
        return `<li class="date-node-substr">
        ${marked.parse(this.getContentNode(d.nodeId).content.substr(0, 100))}
        </li>`;
      }).join("\n")}
      </ol>
      </li>`;
    }).join("\n");

    $('#dates').innerHTML = `<ul>${html}</ul>`;
  }

  async renderTasksFromTasklist(): Promise<string> {
    const entries = Object.values(this.tasklist);
    if (!entries.length) {
      return '';
    }

    const items = await Promise.all(entries.map(async node => {
      const isCompletedTask = !!node.completionDate;
      const strikethrough = (node.isArchived() || isCompletedTask) ? 'strikethrough' : '';
      // Use a unique id for tasks aggregate items to avoid clashing with main outline node ids
      return `<div class="node expanded ${strikethrough}" data-id="${node.id}" id="tasks-id-${node.id}">
  <div class="nodeContent" data-type="${node.type}">
    ${await this.renderContent(node.id)}
  </div>
</div>`;
    }));

    return `<div class="node expanded" data-id="tasks-aggregate" id="id-tasks-aggregate">
  <div class="nodeContent" data-type="text">
    <strong>Tasks</strong>
  </div>
  ${items.join("\n")}
</div>`;
  }

  async renderNode(node: OutlineTree): Promise<string> {
    if (node.id === this.data.id) {
      return await this.render();
    }
    const content: ContentNode = this.data.contentNodes[node.id];
    const collapse = node.collapsed ? 'collapsed' : 'expanded';

    const isCompletedTask = !!content.completionDate;
    const strikethrough = (content.isArchived() || isCompletedTask) ? 'strikethrough' : '';

    if (content.task) {
      this.tasklist[node.id] = content;
    }

    const children = node.children.length ? await Promise.all(node.children.map(async node => {
      return this.renderNode(node);
    })) : [];

    let html = `<div class="node ${collapse} ${strikethrough}" data-id="${node.id}" id="id-${node.id}">
    <div class="nodeContent" data-type="${content.type}">
      ${await this.renderContent(node.id)}
    </div>
    ${children.join("\n")}
    </div>`;

    this.renderDates();

    return html;
  }

  async render() {
    /*
     * render starts at the root node and only renders its children. The root 
     * node only exists as a container around the rest to ensure a standard format
     * for the tree
     */
    // reset tasklist before fresh render
    this.tasklist = {};
    const data = await Promise.all(this.data.tree.children.map(async node => {
      return this.renderNode(node);
    }));
    const tasks = await this.renderTasksFromTasklist();

    return `${tasks}${data.join("\n")}`;
  }
}
