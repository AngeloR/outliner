import { KeyEventDefinition } from "./base";
import { Zoom } from '../lib/zoom';

export const zoomIn: KeyEventDefinition = {
    context: 'navigation',
    keys: ['shift + .'],
    description: 'Zoom into current node (virtual view)',
    action: async args => {
        const { e, cursor, outline } = args;
        e.preventDefault();
        Zoom.enterZoom(cursor, outline);
    }
}


