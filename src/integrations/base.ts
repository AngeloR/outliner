import {Cursor} from "cursor";
import {Outline} from "lib/outline";

export abstract class Integration {
  constructor(public id: string, public name: string) {

  }

  abstract bindEvents(outline: Outline, cursor: Cursor): void;
}
