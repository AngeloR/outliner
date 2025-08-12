import { Outline, RawOutline } from './lib/outline';
import { Cursor } from './cursor';
import keyboardJS from 'keyboardjs';
import * as rawOutline from './test-data.json';
import { Search } from './modals/search';
import { ApiClient } from './api';
import * as _ from 'lodash';
import { loadOutlineModal, openOutlineSelector } from './modals/outline-loader';
import { bindOutlineRenamer } from 'modals/rename-outline';
import { Modal } from 'lib/modal';
import { AllShortcuts } from './keyboard-shortcuts/all';
import { $ } from './dom';
import { DateTime } from 'luxon';

// help is a special shortcut that can't be included in the rest 
// even though its the same Type
import { help } from './keyboard-shortcuts/help';

let outline: Outline;
let cursor: Cursor = new Cursor();
let api: ApiClient = new ApiClient();
let search: Search = new Search();

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
        search
      });
    });
  });
});

// move down
keyboardJS.withContext('navigation', () => {
  keyboardJS.bind('ctrl + o', async e => {
    const res = await openOutlineSelector();
    if (!res.filename || !res.filename.length) {
      return;
    }
    const raw = await api.loadOutline(res.filename.split('.json')[0])

    outline = new Outline(raw);
    outliner().innerHTML = await outline.render();
    cursor.resetCursor();
    await search.reset();
    await search.indexBatch(outline.data.contentNodes);

    document.getElementById('outlineName').innerHTML = outline.data.name;
  });

  keyboardJS.bind('ctrl + n', async e => {
    createNewOutline();
  });
});

function recursivelyExpand(start: HTMLElement) {
  if (start.classList.contains('node')) {
    if (start.classList.contains('collapsed')) {
      start.classList.remove('collapsed');
      start.classList.add('expanded');
      outline.unfold(start.getAttribute('data-id'));
    }

    if (start.parentElement) {
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

async function createNewOutline() {
  outline = new Outline(rawOutline as unknown as RawOutline);
  outline.data.name = `Outline - ${todaysDate()}`;


  outliner().innerHTML = await outline.render();
  cursor.resetCursor();
  document.getElementById('outlineName').innerHTML = outline.data.name;

  keyboardJS.setContext('navigation');
}

function todaysDate() {
  const now = new Date();

  const month = now.getMonth() + 1;

  return `${now.getFullYear()}-${month < 9 ? '0' : ''}${month}-${now.getDate()}-${now.getMinutes()}`;
}

async function main() {
  await api.createDirStructureIfNotExists();
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
      catch (e) {
        console.log(e);
      }
    });
  });

  modal.on('loadOutline', async filename => {
    const raw = await api.loadOutline(filename.split('.json')[0])

    outline = new Outline(raw);
    outliner().innerHTML = await outline.render();
    cursor.resetCursor();

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
      catch (e) {
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

  modal.show();

  setTime();
}

function setTime() {
  $('footer').innerHTML = DateTime.now().toLocaleString(DateTime.DATETIME_FULL);
  setTimeout(setTime, 1000 * 60);
}

main();
