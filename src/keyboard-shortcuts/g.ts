import { KeyEventDefinition } from "./base";

export const gg: KeyEventDefinition = {
  context: 'navigation',
  keys: ['g'],
  description: 'Scroll to the very top of the document',
  action: async args => {
    const { e, cursor } = args;
    e.preventDefault();
    e.stopPropagation();

    // Select the first node and scroll it into view (aligns to top)
    cursor.set('.node');
  }
}


