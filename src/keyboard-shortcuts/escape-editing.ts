import { KeyEventDefinition } from "./base";
import keyboardJS from 'keyboardjs';

export const escapeEditing: KeyEventDefinition = {
  context: 'editing',
  keys: ['esc', 'enter'],
  description: 'Stop editing the current node and return to "navigation" mode',
  action: async args => {
    const { e, cursor, outline, api, search } = args;
    // if you press shift+enter, don't do anything
    if (e.shiftKey && e.key === 'Enter') {
      return;
    }

    cursor.get().classList.remove('hidden-cursor');

    const contentNode = cursor.get().querySelector('.nodeContent') as HTMLElement;

    contentNode.contentEditable = "false";
    contentNode.blur();
    keyboardJS.setContext('navigation');

    outline.updateContent(cursor.getIdOfNode(), contentNode.innerHTML.trim());
    // re-render this node!
    contentNode.innerHTML = await outline.renderContent(cursor.getIdOfNode());
    outline.renderDates();

    // persist changes (single-file OPML)
    api.save(outline);

    // reset the doc in search
    // search.replace(outline.getContentNode(cursor.getIdOfNode()));
  }
}
