import { Outline, RawOutline } from './lib/outline';
import { Cursor } from './cursor';
import keyboardJS from 'keyboardjs';
import * as rawOutline from './test-data.json';
import { Search } from './modals/search';
import { ApiClient } from './api';
import {loadOutlineModal, openOutlineSelector} from './modals/outline-loader';
import {bindOutlineRenamer} from 'modals/rename-outline';
import {Modal} from 'lib/modal';
import { AllShortcuts } from './keyboard-shortcuts/all';
import { $ } from './dom';
import { DateTime } from 'luxon';
import { appWindow } from '@tauri-apps/api/window';

// help is a special shortcut that can't be included in the rest 
// even though its the same Type
import { help } from './keyboard-shortcuts/help';
import { ConfigReader } from 'lib/config-reader';

let outline: Outline;
let cursor: Cursor = new Cursor();
let api: ApiClient = new ApiClient();
let search: Search = new Search();
const config: ConfigReader = new ConfigReader();

function outliner() {
  return document.querySelector('#outliner');
}

AllShortcuts.concat(help).forEach(def => {
  keyboardJS.withContext(def.context, () => {
    keyboardJS.bind(def.keys, async e => {
      def.action({
        e: e,
        outline,
        cursor,
        api,
        search,
        config
      });
    });
  });
});


// move down
keyboardJS.withContext('navigation', () => {
  keyboardJS.bind('ctrl + o', async e => {
    const res = await openOutlineSelector();
    if(!res.filename || !res.filename.length) {
      return;
    }
    const raw = await api.loadOutline(res.filename.split('.json')[0])

    outline = new Outline(raw);
    outliner().innerHTML = outline.render();
    cursor.resetCursor();
    outline.renderNodeDetails(cursor.getIdOfNode());
    await search.reset();
    await search.indexBatch(outline.data.contentNodes);

    document.getElementById('outlineName').innerHTML = outline.data.name;
  });

  keyboardJS.bind('ctrl + n', async e => {
    createNewOutline();
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

  api.save(outline);
};

function createNewOutline() {
  outline = new Outline(rawOutline as unknown as RawOutline); 
  outline.data.name = `Outline - ${todaysDate()}`;


  outliner().innerHTML = outline.render();
  cursor.resetCursor();
    outline.renderNodeDetails(cursor.getIdOfNode());
  document.getElementById('outlineName').innerHTML = outline.data.name;

  keyboardJS.setContext('navigation');
}

function todaysDate() {
  const now = new Date();

  const month = now.getMonth() + 1;

  return `${now.getFullYear()}-${month < 9 ? '0':''}${month}-${now.getDate()}-${now.getMinutes()}`;
}

async function main() {
  await api.createDirStructureIfNotExists();
  await config.loadFile();
  const modal = loadOutlineModal();

  modal.on('createOutline', () => {
    createNewOutline();
    modal.remove();
    bindOutlineRenamer().on('attemptedRename', async (newName) => {
      try {
        await api.renameOutline(outline.data.name, newName);
        outline.data.name = newName;
        await api.saveOutline(outline);
        document.getElementById('outlineName').innerHTML = outline.data.name;
        modal.remove();
      }
      catch(e) {
        console.log(e);
      }
    });
  });

  modal.on('loadOutline', async filename => {
    const raw = await api.loadOutline(filename.split('.json')[0])

    outline = new Outline(raw);
    outliner().innerHTML = outline.render();
    cursor.resetCursor();
    outline.renderNodeDetails(cursor.getIdOfNode());

    document.getElementById('outlineName').innerHTML = outline.data.name;

    keyboardJS.setContext('navigation');
    modal.remove();
    bindOutlineRenamer().on('attemptedRename', async (newName: string, modal: Modal) => {
      try {
        await api.renameOutline(outline.data.name, newName);
        outline.data.name = newName;
        await api.saveOutline(outline);
        document.getElementById('outlineName').innerHTML = outline.data.name;
        modal.remove();
      }
      catch(e) {
        console.log(e);
      }
    });

    search.createIndex({
      id: "string",
      content: "string",
    }).then(async () => {
      await search.indexBatch(outline.data.contentNodes);
    });
  });

  // we want to bind to the drop event on the window
  appWindow.onFileDropEvent(async (event) => {
    if(event.payload.type === 'drop') {

      if(event.payload.paths.length) {
        // we only support uploading a single file for now..
        //@TODO: add some checks to ensure we're only supporting images
        const file = await api.copyImage(event.payload.paths[0]);
        console.log('original file path', event.payload.paths[0]);
        console.log('new file path', file.filePath);

        // insert it one level below current cursor
        const res = outline.createSiblingNode(cursor.getIdOfNode())

        // just use the filename!
        res.node.content = `![Newly Uploaded Image](${file.fileName})`;

        const html = outline.renderNode(res.parentNode);
        if(outline.isTreeRoot(res.parentNode.id)) {
          cursor.get().parentElement.innerHTML = html;
        }
        else {
          cursor.get().parentElement.outerHTML = html;
        }

        cursor.set(`#id-${res.node.id}`);
        api.saveContentNode(res.node);
        api.save(outline);
        outline.renderNodeDetails(cursor.getIdOfNode());

      }
    }
  });

  modal.show();

  setTime();
}

function setTime() {
  if(outline) {
    outline.pruneDates();
    outline.renderDates();
  }
  $('footer').innerHTML = DateTime.now().toLocaleString(DateTime.DATETIME_FULL);
  setTimeout(setTime, 1000 * 60);
}

main();
