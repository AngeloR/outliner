import {KeyEventDefinition} from "./base";
import { helpModal } from '../modals/help';

export const help: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + /'],
  description: 'Display help modal',
  action: args => {
    helpModal.show();
  }
}
