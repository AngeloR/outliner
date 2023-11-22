import { keyBy, map, sortBy, each } from 'lodash';
import { v4 as uuid } from 'uuid';
import { marked } from 'marked';
import { ContentNode } from './contentNode';
import * as markdownParsers from './parsers/md-parser';
import { DateTime } from 'luxon';
import { FindDate } from './parsers/date';
import {$} from 'dom';

marked.use({
  renderer: { 
    link: markdownParsers.link,
    image: markdownParsers.image
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

export type FlatTreeNode = {
  id: string;
  depth: number;
}

type DateStorage = {
  nodeId: string;
  date: DateTime;
}

type NodeID = string;
type IsoDate = string;

export class Outline {
  data: RawOutline;
  // we use this format for enforce easy uniqueness
  dates: Record<IsoDate, Record<NodeID, DateStorage>>;

  constructor(outlineData: RawOutline) {
    this.data = JSON.parse(JSON.stringify(outlineData)) as RawOutline;
    this.dates = {};

    if(!SupportedVersions.includes(this.data.version)) {
      throw new Error(`The version of outliner you have doesn't support opening this doc`);
    }

    this.data.contentNodes = keyBy(map(this.data.contentNodes, n => ContentNode.Create(n)), n => n.id);
  }

  pruneDates() {
    const now = DateTime.now();
    Object.keys(this.dates).forEach(key => {
      if(now > DateTime.fromISO(key)) {
        delete this.dates[key];
      }
    });
  }

  isTreeRoot(id: string) {
    return this.data.id === id;
  }

  findNodeInTree(root: OutlineTree, id: string, action: (item: OutlineTree, parent: OutlineTree) => void, runState: boolean = false) {
    let run = runState;
    if(run) {
      return;
    }
    each(root.children, (childNode, idx) => {
      if(childNode.id === id) {
        action(childNode, root);
        run = true;
        return false;
      }
      else if(childNode.children) {
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

  flattenOutlineTreeChildren(tree: OutlineTree, depthTracker: number = 0): FlatTreeNode[] {
    let flat: FlatTreeNode[] = [{id: tree.id, depth: depthTracker}];

    if(tree.children.length > 0) {
      flat = flat.concat(
        ...tree.children.map(node => {
          return this.flattenOutlineTreeChildren(node, depthTracker+1);
        })
      );
    }

    return flat;
  }

  liftNodeToParent(nodeId: string) {
    let run = false;
    let targetNode: OutlineTree, parentNode: OutlineTree;
    this.findNodeInTree(this.data.tree, nodeId, (tNode, pNode) => {
      targetNode = tNode;
      this.findNodeInTree(this.data.tree, pNode.id, (originalParentNode, newParentNode) => {;
          if(run) {
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
      if(run) {
        return;
      }
      run  = true;
      targetNode = tNode;
      
      let idList = pNode.children.map(n => n.id);
      // there are no other siblings so we can't do anything
      if(idList.length === 1) {
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

        if(nodePosition === (flatId.length - 1)) {
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

        if(nodePosition === 0) {
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

    if(!nodeId) {
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
      if(run) {
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
    if(!this.data.contentNodes[id]) {
      throw new Error('Invalid node');
    }

    this.data.contentNodes[id].content = content;
  }

  getContentNode(id: string) {
    if(!this.data.contentNodes[id]) {
      throw new Error(`Invalid Node ${id}`);
    }

    return this.data.contentNodes[id];
  }

  renderContent(nodeId: string): string {
    let node = this.getContentNode(nodeId)
    let content: string;
    switch(node.type) {
      case 'text':
        content = marked.parse(node.content);

        const now = DateTime.now();
        const foundDates = FindDate(node.content);
        if(foundDates.length) {
          foundDates.forEach(d => {
            // only deal with dates AFTER today
            if(now.startOf('day').toMillis() > d.toMillis()) {
              return;
            }
            if(!this.dates[d.toISODate()]) {
              this.dates[d.toISODate()] = {};
            }

            if(!this.dates[d.toISODate()][node.id]) {
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

  renderNodeDetails(nodeId: string) {
    const node = this.getContentNode(nodeId);
    const date = DateTime.fromMillis(node.lastUpdated || node.created)
    $('#node-details').innerHTML = `
    <input type="text" disabled value="${node.id}" class="node-id"><br>
    <div class="last-updated">
      ${date.toLocaleString()}
    </div>
    <b>Archived: </b> ${node.isArchived() ? DateTime.fromMillis(node.archiveDate).toLocaleString() : 'n/a'}<br>
    `;
  }

  renderDates() {
    const sortedDates = sortBy(Object.keys(this.dates).map(d => DateTime.fromISO(d)), d => d.toSeconds());

    let html = sortedDates.map(dateKey => {
      return `<li><div class="date-header">${dateKey.toLocaleString({
        weekday: 'long',
        day: '2-digit',
        month: 'short'
      })}
      </div>
      <ol class="date-node-display">
      ${map(this.dates[dateKey.toISODate()], d => {
        return `<li class="date-node-substr">
        ${marked.parse(this.getContentNode(d.nodeId).content.substr(0, 100))}
        </li>`;
      }).join("\n")}
      </ol>
      </li>`;
    }).join("\n");

    $('#dates').innerHTML = `<ul>${html}</ul>`;
  }

  renderNode(node: OutlineTree): string {
    if(node.id === this.data.id) {
      return this.render();
    }
    const content: ContentNode = this.data.contentNodes[node.id];
    const collapse = node.collapsed ? 'collapsed': 'expanded';
    const published = content.isPublished() ? 'published' : '';

    const strikethrough = content.isArchived() ? 'strikethrough' : '';

    let html = `<div class="node ${collapse} ${strikethrough} ${published}" data-id="${node.id}" id="id-${node.id}">
    <div class="nodeContent" data-type="${content.type}">
      ${this.renderContent(node.id)}
    </div>
    ${node.children.length ? map(node.children, this.renderNode.bind(this)).join("\n") : ''}
    </div>`;

    this.renderDates();

    return html;
  }

  render() {
    /*
     * render starts at the root node and only renders its children. The root 
     * node only exists as a container around the rest to ensure a standard format
     * for the tree
     */
    return map(this.data.tree.children, this.renderNode.bind(this)).join("\n");
  }
}
