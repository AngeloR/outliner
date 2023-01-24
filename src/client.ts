import { Outline, RawOutline } from './outline';
import { Cursor } from './cursor';
import keyboardJS from 'keyboardjs';
import * as rawOutline from './test-data.json';
import {showHelp} from 'help';
import { Search } from './search';

let outlineData = rawOutline;
if(localStorage.getItem('activeOutline')) {
  const outlineId = localStorage.getItem('activeOutline');
  outlineData = JSON.parse(localStorage.getItem(outlineId));
}

const state = new Map<string, any>();
const outline = new Outline(outlineData as unknown as RawOutline);
outliner().innerHTML = outline.render();

const cursor = new Cursor();
// place the cursor at the top!
cursor.set('.node');

const search = new Search();

function outliner() {
  return document.querySelector('#outliner');
}

document.getElementById('display-help').addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();

  showHelp();
});

// move down
keyboardJS.withContext('navigation', () => {
  keyboardJS.bind('j', e => {
    // move cursor down
    // if shift key is held, swap the node with its next sibling
    const sibling = cursor.get().nextElementSibling;

    if(sibling) {
      if(e.shiftKey) {
        // swap this node with its previous sibling
        const res = outline.swapNodeWithNextSibling(cursor.getIdOfNode());
        const html = outline.renderNode(res.parentNode);

        if(res.parentNode.id === '000000') {
          cursor.get().parentElement.innerHTML = html;
        }
        else {
          cursor.get().parentElement.outerHTML = html;
        }

        cursor.set(`#id-${res.targetNode.id}`);
        save();
      }
      else {
        cursor.set(`#id-${sibling.getAttribute('data-id')}`);
      }
    }
  });


  keyboardJS.bind('shift + /', e => {
    showHelp();
  });

  keyboardJS.bind('k', e => {
    // move cursor up
    // if shift key is held, swap the node with its previous sibling
    const sibling = cursor.get().previousElementSibling;

    if(sibling && !sibling.classList.contains('nodeContent')) {
      if(e.shiftKey) {
        // swap this node with its previous sibling
        const res = outline.swapNodeWithPreviousSibling(cursor.getIdOfNode());
        // re-render the parent node and display that!
        const html = outline.renderNode(res.parentNode);

        if(res.parentNode.id === '000000') {
          cursor.get().parentElement.innerHTML = html;
        }
        else {
          cursor.get().parentElement.outerHTML = html;
        }

        cursor.set(`#id-${res.targetNode.id}`);
        save();
      }
      else {
        cursor.set(`#id-${sibling.getAttribute('data-id')}`);
      }
    }
  });

  keyboardJS.bind('l', e => {
    // if the node is collapsed, we can't go into its children
    if(cursor.isNodeCollapsed()) {
      return;
    }
    if(e.shiftKey) {
      const res = outline.lowerNodeToChild(cursor.getIdOfNode());
      const html = outline.renderNode(res.oldParentNode);

      if(res.oldParentNode.id === '000000') {
        cursor.get().parentElement.innerHTML = html;
      }
      else {
        cursor.get().parentElement.outerHTML = html;
      }
      cursor.set(`#id-${res.targetNode.id}`);
    }
    else {
      const children = cursor.get().querySelector('.node');
      if(children) {
        cursor.set(`#id-${children.getAttribute('data-id')}`);
      }
    }
  });

  keyboardJS.bind('h', e => {
    const parent = cursor.get().parentElement;
    if(parent && parent.classList.contains('node')) {
      if(e.shiftKey) {
        if(outline.data.tree.children.map(n => n.id).includes(cursor.getIdOfNode())) {
          // if this is a top level item, we can't elevate any further
          return;
        }
        const res = outline.liftNodeToParent(cursor.getIdOfNode());

        const html = outline.renderNode(res.parentNode);

        if(res.parentNode.id === '000000') {
          cursor.get().parentElement.parentElement.innerHTML = html;
        }
        else {
          cursor.get().parentElement.parentElement.outerHTML = html;
        }

        cursor.set(`#id-${res.targetNode.id}`);
        save();
      }
      else {
        cursor.set(`#id-${parent.getAttribute('data-id')}`);
      }
    }
  });

  keyboardJS.bind('z', e => {
    // toggle collapse
    if(cursor.isNodeExpanded()) {
      cursor.collapse();
      outline.fold(cursor.getIdOfNode());
    }
    else if(cursor.isNodeCollapsed()) {
      cursor.expand();
      outline.unfold(cursor.getIdOfNode());
    }
    save();
  });

  keyboardJS.bind('shift + 4', e => {
    e.preventDefault();
    // switch to editing mode
    cursor.get().classList.add('hidden-cursor');
    const contentNode = cursor.get().querySelector('.nodeContent') as HTMLElement;

    // swap the content to the default!
    contentNode.innerHTML = outline.data.contentNodes[cursor.getIdOfNode()].content;
    contentNode.contentEditable = "true";

    const range = document.createRange();
    range.selectNodeContents(contentNode);
    range.collapse(false);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    contentNode.focus();
    keyboardJS.setContext('editing');
  });

  keyboardJS.bind('i', e => {
    e.preventDefault();
    // switch to editing mode
    cursor.get().classList.add('hidden-cursor');
    const contentNode = cursor.get().querySelector('.nodeContent') as HTMLElement;

    // swap the content to the default!
    contentNode.innerHTML = outline.data.contentNodes[cursor.getIdOfNode()].content;
    contentNode.contentEditable = "true";
    contentNode.focus();
    keyboardJS.setContext('editing');
  });

  keyboardJS.bind('shift + x', e => {
    e.preventDefault();
    // toggle "strikethrough" of node
    cursor.get().classList.toggle('strikethrough');
    outline.data.contentNodes[cursor.getIdOfNode()].strikethrough = cursor.get().classList.contains('strikethrough');
    save();
  });

  keyboardJS.bind('tab', e => {
    e.preventDefault();

    const res = outline.createChildNode(cursor.getIdOfNode());
    const html = outline.renderNode(res.parentNode);

    cursor.get().outerHTML = html;

    cursor.set(`#id-${res.node.id}`);
    save();
  });
  
  keyboardJS.bind('enter', e => {
    // create a new node as a sibling of the selected node
    if(e.shiftKey) {
      return;
    }
    e.preventDefault();
    e.preventRepeat();

    const res = outline.createSiblingNode(cursor.getIdOfNode());

    const html = outline.renderNode(res.parentNode);
    if(res.parentNode.id === '000000') {
      cursor.get().parentElement.innerHTML = html;
    }
    else {
      cursor.get().parentElement.outerHTML = html;
    }

    cursor.set(`#id-${res.node.id}`);
    save();
  });

  keyboardJS.bind('d', e => {
    // deleting a node requires d + shift
    if(!e.shiftKey) {
      return;
    }

    const res = outline.removeNode(cursor.getIdOfNode());
    const html = outline.renderNode(res.parentNode);
    // the previous sibling!
    const prevSibling = cursor.get().previousElementSibling;
    const nextSibling = cursor.get().nextElementSibling;
    if(res.parentNode.id === '000000') {
      cursor.get().parentElement.innerHTML = html;
    }
    else {
      cursor.get().parentElement.outerHTML = html;
    }

    if(prevSibling.getAttribute('data-id')) {
      cursor.set(`#id-${prevSibling.getAttribute('data-id')}`);
    }
    else if(nextSibling.getAttribute('data-id')) {
      cursor.set(`#id-${nextSibling.getAttribute('data-id')}`);
    }
    else {
      console.log(res.parentNode.id);
      cursor.set(`#id-${res.parentNode.id}`);
    }

    save();
  });
});

keyboardJS.withContext('editing', () => {
  keyboardJS.bind(['esc', 'enter'], e => {
    cursor.get().classList.remove('hidden-cursor');

    const contentNode = cursor.get().querySelector('.nodeContent') as HTMLElement;

    contentNode.contentEditable = "false";
    contentNode.blur();
    keyboardJS.setContext('navigation');

    outline.updateContent(cursor.getIdOfNode(), contentNode.innerHTML.trim());
    // re-render this node!
    contentNode.innerHTML = outline.renderContent(cursor.getIdOfNode());
    save();
  });
});

keyboardJS.setContext('navigation');

search.createIndex({
  id: "string",
  created: "number",
  type: "string",
  content: "string",
  strikethrough: "boolean"
}).then(async () => {
  await search.indexBatch(outline.data.contentNodes);
  search.bindEvents();
});

function recursivelyExpand(start: HTMLElement) {
  if(start.classList.contains('node')) {
    if(start.classList.contains('collapsed')) {
      start.classList.remove('collapsed');
      start.classList.add('expanded');
      outline.unfold(start.getAttribute('data-id'));
    }

    if(start.parentElement) {
      recursivelyExpand(start.parentElement)
    }
  }
}

search.onTermSelection = (docId: string) => {
  // if any parent element in the chain to this node
  // are collapsed, we want to make sure we expand them

  recursivelyExpand(document.getElementById(`id-${docId}`).parentElement);
  cursor.set(`#id-${docId}`);

  save();
};

function saveImmediate() {
  localStorage.setItem(outline.data.id, JSON.stringify(outline.data));
  localStorage.setItem('activeOutline', outline.data.id);
  console.log('saved...', outline.data);
  state.delete('saveTimeout');
}

function save() {
  if(!state.has('saveTimeout')) {
    state.set('saveTimeout', setTimeout(saveImmediate, 2000));
  }
}


save();
