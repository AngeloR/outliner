import { map } from 'lodash';
import { Modal } from '../lib/modal';

const keyboardCommands = {
  'h': 'Move the cursor to the Parent Element of the current node',
  'l': 'Move the cursor to the first Child Element of the current node',
  'j': 'Move the cursor to the next sibling of the current node',
  'k': 'Move the cursor to the previous sibling of the current node',
  'enter': 'Add a new node as a sibling to the current node',
  'tab': 'Add a new node as the child of the current node',
  'shift + j': 'Swap the current node with next sibling node',
  'shift + k': 'Swap the current node with the previous sibling node',
  'shift + h': 'Lift the current node to be a sibling of the parent node',
  'shift + l': 'Lower the current node to be a child of the previous sibling node',
  'shift + d': 'Delete the current node',
  'shift + f': 'Open the search modal',
  'i': 'Enter "edit" mode, and place the cursor at the start of the editable content',
  '$': 'Enter "edit" mode, and place the cursor at the end of the editable content',
  'escape': 'Exit the current mode and return to "navigation" mode',
  '?': 'Display this help dialogue'
};

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
  ${map(keyboardCommands, (text, key) => {
    return `
    <tr>
      <td>
        <kbd>${key}</kbd>
      </td>
      <td>
        ${text}
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
