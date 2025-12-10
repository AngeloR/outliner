import { KeyEventDefinition } from "./base";
import { $$ } from "../dom";

export const shiftG: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + g'],
  description: 'Scroll to the very bottom of the document',
  action: async args => {
    const { e, cursor } = args;
    e.preventDefault();
    e.stopPropagation();

    // Find the last node that is actually visible in the tree (not hidden by a collapsed ancestor)
    const allNodes = $$('.node');
    let lastVisible: HTMLElement | null = null;
    for (let i = 0; i < allNodes.length; i++) {
      const el = allNodes[i] as HTMLElement;
      const collapsedAncestor = el.closest('.collapsed') as HTMLElement | null;
      const hiddenByAncestorCollapse = !!collapsedAncestor && collapsedAncestor !== el;
      if (!hiddenByAncestorCollapse) {
        lastVisible = el;
      }
    }

    if (lastVisible) {
      if (lastVisible.id) {
        cursor.set(`#${lastVisible.id}`);
      }
      lastVisible.scrollIntoView({ behavior: 'smooth', block: 'end' });
      return;
    }

    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    if ('scrollTo' in window) {
      window.scrollTo({ top: scrollHeight, behavior: 'smooth' });
    } else {
      document.documentElement.scrollTop = scrollHeight;
      document.body.scrollTop = scrollHeight;
    }
  }
}


