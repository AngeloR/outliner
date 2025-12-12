import * as Dialog from '@tauri-apps/plugin-dialog';
import * as path from '@tauri-apps/api/path';
import { Modal } from '../lib/modal';

const loaderHTML = `
<p>To begin, either create a new outline or open an existing one.</p>
<div align="center" class="clearfix" id="outlineLoader">
<a href="#" id="create-outline" class="button large">Create New Outline</a>
<a href="#" id="open-outline-selector" class="button large">Open Existing Outline</a>
</div>
`;

function loadOutline(filename: string) {
  console.log(filename);
}

export async function openOutlineSelector() {
  const selected = await Dialog.open({
    multiple: false,
    defaultPath: await path.join(await path.appLocalDataDir(), 'outliner'),
    directory: false,
    title: 'Select Outline',
    filters: [{
      name: 'OPML',
      extensions: ['opml']
    }]
  });

  if(selected) {
    return {
      filename: await path.basename(selected.toString()),
      fqp: selected
    };
  }

  return {
    filename: null,
    fqp: null
  };
}

export function loadOutlineModal() {
  const modal = new Modal({
    title: 'Load Outline',
    escapeExitable: false
  }, loaderHTML);

  modal.on('rendered', () => {
    document.getElementById('create-outline').addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      modal.emit('createOutline', [e]);
    });

    document.getElementById('open-outline-selector').addEventListener('click', async e => {
      e.preventDefault();
      e.stopPropagation();

      const selected = await openOutlineSelector();

      if(selected) {
        modal.emit('loadOutline', [selected.filename]);
      }
    });
  });

  return modal;
}

