import { Outline, RawOutline } from '../lib/outline';
import { Cursor } from './cursor';
import keyboardJS from 'keyboardjs';
import * as rawOutline from './test-data.json';
import {helpModal} from './help';
import { Search } from './search';
import { ApiClient } from './api';
import * as _ from 'lodash';
import {loadOutlineModal} from './modals/outline-loader';


let outline: Outline;
let cursor: Cursor = new Cursor();
let api: ApiClient = new ApiClient();
let search: Search = new Search();
const state = new Map<string, any>();


function outliner() {
  return document.querySelector('#outliner');
}

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

        if(outline.isTreeRoot(res.parentNode.id)) {
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
    helpModal.show();
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

        if(outline.isTreeRoot(res.parentNode.id)) {
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

      if(outline.isTreeRoot(res.oldParentNode.id)) {
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

        if(outline.isTreeRoot(res.parentNode.id)) {
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
    outline.getContentNode(cursor.getIdOfNode()).toggleArchiveStatus();
    api.saveContentNode(outline.getContentNode(cursor.getIdOfNode()));
    save();
  });

  keyboardJS.bind('tab', e => {
    e.preventDefault();

    const res = outline.createChildNode(cursor.getIdOfNode());
    const html = outline.renderNode(res.parentNode);

    cursor.get().outerHTML = html;

    cursor.set(`#id-${res.node.id}`);
    api.saveContentNode(res.node);
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
    if(outline.isTreeRoot(res.parentNode.id)) {
      cursor.get().parentElement.innerHTML = html;
    }
    else {
      cursor.get().parentElement.outerHTML = html;
    }

    cursor.set(`#id-${res.node.id}`);
    api.saveContentNode(res.node);
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
    if(outline.isTreeRoot(res.parentNode.id)) {
      cursor.get().parentElement.innerHTML = html;
    }
    else {
      cursor.get().parentElement.outerHTML = html;
    }

    if(prevSibling && prevSibling.getAttribute('data-id')) {
      cursor.set(`#id-${prevSibling.getAttribute('data-id')}`);
    }
    else if(nextSibling && nextSibling.getAttribute('data-id')) {
      cursor.set(`#id-${nextSibling.getAttribute('data-id')}`);
    }
    else {
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

    // push the new node content remotely!
     api.saveContentNode(outline.getContentNode(cursor.getIdOfNode()));
  });
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

function save() {
  if(!state.has('saveTimeout')) {
    state.set('saveTimeout', setTimeout(async () => {
      await api.saveOutline(outline);
      state.delete('saveTimeout');
    }, 2000));
  }
}

async function main() {
  await api.createDirStructureIfNotExists();
  const modal = loadOutlineModal();

  // on launch, give the user the option of creating a new outline 
  // or opening an existing one
  modal.on('createOutline', () => {
      outline = new Outline(rawOutline as unknown as RawOutline); 

      outliner().innerHTML = outline.render();
      cursor.resetCursor();

      keyboardJS.setContext('navigation');
      modal.remove();
  });

  modal.on('loadOutline', async filename => {
    const raw = await api.loadOutline(filename.split('.json')[0])

    outline = new Outline(raw);
    outliner().innerHTML = outline.render();
    cursor.resetCursor();

    document.getElementById('outliner-name').innerHTML = outline.data.name;

    keyboardJS.setContext('navigation');
    modal.remove();

    search.createIndex({
      id: "string",
      content: "string",
    }).then(async () => {
      await search.indexBatch(outline.data.contentNodes);
      search.bindEvents();
    });
  });

  modal.show();
}

main();
