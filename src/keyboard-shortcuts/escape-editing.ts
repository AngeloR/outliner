import {KeyEventDefinition} from "./base";
import keyboardJS from 'keyboardjs';

export const escapeEditing: KeyEventDefinition = {
  context: 'editing',
  keys: ['esc', 'enter'],
  description: 'Stop editing the current node and return to "navigation" mode',
  action: args => {

    // if you press shift+enter, it means you want a new line within the 
    // node that you're currently editing, so we don't actually want to
    // exit from the editing context
    if(args.e.shiftKey && args.e.key.toLowerCase() === 'enter') {
      return;
    }

    const {cursor, outline, api, search} = args;
    cursor.get().classList.remove('hidden-cursor');

    const contentNode = cursor.get().querySelector('.nodeContent') as HTMLElement;

    contentNode.contentEditable = "false";
    contentNode.blur();
    keyboardJS.setContext('navigation');

    outline.updateContent(cursor.getIdOfNode(), contentNode.innerHTML.trim());
    // re-render this node!
    contentNode.innerHTML = outline.renderContent(cursor.getIdOfNode());
    outline.renderDates();

    // push the new node content remotely!
    api.saveContentNode(outline.getContentNode(cursor.getIdOfNode()));

    // reset the doc in search
    search.replace(outline.getContentNode(cursor.getIdOfNode()));
  }
}
