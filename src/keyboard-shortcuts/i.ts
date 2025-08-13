import { KeyEventDefinition } from "./base";
import keyboardJS from "keyboardjs";

export const i: KeyEventDefinition = {
  context: 'navigation',
  keys: ['i'],
  description: 'Enter "edit" mode and place the cursor at the start of the editable content',
  action: async args => {
    const { e, cursor, outline } = args;
    e.preventDefault();
    // switch to editing mode
    cursor.get().classList.add('hidden-cursor');
    const contentNode = cursor.get().querySelector('.nodeContent') as HTMLElement;

    // swap the content to the default!
    contentNode.innerHTML = outline.data.contentNodes[cursor.getIdOfNode()].content;
    contentNode.contentEditable = "true";
    contentNode.focus();
    keyboardJS.setContext('editing');
  }
}
