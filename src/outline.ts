import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { marked } from 'marked';

export interface RawOutline {
  id: string;
  created: number;
  name: string;
  tree: OutlineTree;
  contentNodes: Record<string, OutlineNode>
}

export interface OutlineTree {
  id: string;
  children: OutlineTree[]
  collapsed: boolean;
}

export interface OutlineNode {
  id: string;
  created: number;
  type: 'text',
  content: string,
  strikethrough: boolean;
};

export class Outline {
  data: RawOutline;

  constructor(outlineData: RawOutline) {
    this.data = outlineData;
  }

  findNodeInTree(root: OutlineTree, id: string, action: (item: OutlineTree, parent: OutlineTree) => void, runState: boolean = false) {
    let run = runState;
    if(run) {
      return;
    }
    _.each(root.children, (childNode, idx) => {
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

  flattenOutlineTreeChildren(tree: OutlineTree): string[] {
    return tree.children.map(node => node.id);
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

  createSiblingNode(targetNode: string, nodeData?: OutlineNode) {
    const outlineNode: OutlineNode = nodeData || {
      id: uuid(),
      created: Date.now(),
      type: 'text',
      content: '---',
      strikethrough: false
    };

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
    const node: OutlineNode = nodeId ? this.data.contentNodes[nodeId] :
    {
      id: uuid(),
      created: Date.now(),
      type: 'text',
      content: '---',
      strikethrough: false
    };

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

  renderContent(nodeId: string): string {
    let node = this.data.contentNodes[nodeId];
    let content: string;
    switch(node.type) {
      case 'text':
        content = marked.parse(node.content);
        break;
      default: 
        content = node.content;
        break;
    }

    return content;
  }

  renderNode(node: OutlineTree): string {
    if(node.id === '000000') {
      return this.render();
    }
    const collapse = node.collapsed ? 'collapsed': 'expanded';
    const content: OutlineNode = this.data.contentNodes[node.id] || {
      id: node.id,
      created: Date.now(),
      type: 'text',
      content: '',
      strikethrough: false
    };

    const strikethrough = content.strikethrough ? 'strikethrough' : '';

    let html = `<div class="node ${collapse} ${strikethrough}" data-id="${node.id}" id="id-${node.id}">
    <div class="nodeContent" data-type="${content.type}">
      ${this.renderContent(node.id)}
    </div>
    ${node.children.length ? _.map(node.children, this.renderNode.bind(this)).join("\n") : ''}
    </div>`

    return html;
  }

  render() {
    /*
     * render starts at the root node and only renders its children. The root 
     * node only exists as a container around the rest to ensure a standard format
     * for the tree
     */
    return _.map(this.data.tree.children, this.renderNode.bind(this)).join("\n");
  }
}
