import {KeyEventDefinition} from "./base";
import keyboardJS from "keyboardjs";

export const $: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + 4'],
  description: 'Enter "Edit" mode and place the cursor at the end of the editable content',
  action: args => {
    const { cursor, outline, e } = args;
    e.preventDefault();
    // switch to editing mode
    cursor.get().classList.add('hidden-cursor');
    const contentNode = cursor.get().querySelector('.nodeContent') as HTMLElement;

    // swap the content to the default!
    contentNode.textContent = outline.data.contentNodes[cursor.getIdOfNode()].content;
    contentNode.contentEditable = "true";

    const range = document.createRange();
    range.selectNodeContents(contentNode);
    range.collapse(false);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    contentNode.focus();
    keyboardJS.setContext('editing');
  }
}
