import {$} from 'dom';
import { Modal } from '../lib/modal';

function renameOutlineHTML() {
  return `
  <form id="outline-renamer">
      <input type="text" value="${document.querySelector('#outlineName').innerHTML}" name="new-outline-name" id="new-outline-name">
      <button type="submit">Rename</button>
  </form>
  `;
}

export function bindOutlineRenamer() {
  const modal = renameOutline();

  $('#outlineName').addEventListener('click', e => {
    modal.show();

    $('#outline-renamer').addEventListener('submit', async e => {
      e.preventDefault();
      e.stopPropagation();

      const newName = ($('#new-outline-name') as HTMLInputElement).value;
      modal.emit('attemptedRename', [newName, modal]);
    });
  });

  return modal;
}

export function renameOutline() {
  const modal = new Modal({
    title: 'Rename Outline',
    escapeExitable: true
  }, renameOutlineHTML());

  return modal;
}
