import { map } from 'lodash';
import { Modal } from '../lib/modal';
import { AllShortcuts } from 'keyboard-shortcuts/all';

const modalHTML = `
  <p><b>Daily Backup:</b> The daily backup system lets you mash the "Daily Backup" button as much as you'd like.. but will only save the last time you clicked on it. You can only click it once and hour. Your content will always be saved in local-storage as well, but its always good to have a backup system.</p>
  <table>
  <thead>
  <tr>
  <th>Key</th>
  <th>Action</th>
  </tr>
  </thead>
  <tbody>
  ${map(AllShortcuts, (shortcut) => {
    return `
    <tr>
      <td>
        ${shortcut.keys.map(k => `<kbd>${k}</kbd>`).join(" or ")}
      </td>
      <td>
        ${shortcut.description}
      </td>
    </tr>
    `
  }).join("\n")}
  </tbody>
  </table>
`

export const helpModal = new Modal({
  title: 'Help',
  keyboardContext: 'help',
  escapeExitable: true
}, modalHTML);
