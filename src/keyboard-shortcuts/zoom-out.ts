import { KeyEventDefinition } from "./base";
import { Zoom } from '../lib/zoom';

export const zoomOut: KeyEventDefinition = {
  context: 'navigation',
  keys: ['shift + ,'],
  description: 'Exit zoom and return to full outline',
  action: async args => {
    const { e, cursor } = args;
    e.preventDefault();
    Zoom.exitZoom(cursor);
  }
}


