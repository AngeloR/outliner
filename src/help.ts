import keyboardJS from 'keyboardjs';
import { map } from 'lodash';

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
  'i': 'Enter "edit" mode, and place the cursor at the start of the editable content',
  '$': 'Enter "edit" mode, and place the cursor at the end of the editable content',
  'escape': 'Exit the current mode and return to "navigation" mode',
  '?': 'Display this help dialogue'
};

const modalHTML = `
  <div class="modal">
  <div class="modal-content">
    <h1>Help</h1>
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
  </div>
  </div>
`

export function showHelp() {
  document.querySelector('body').innerHTML += modalHTML;
  keyboardJS.setContext('help');
}

keyboardJS.withContext('help', () => {
  keyboardJS.bind('escape', e => {
    document.querySelector('.modal').remove();
    keyboardJS.setContext('navigation');
  });
});
