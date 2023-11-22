import {Cursor} from "cursor";
import { ConfigReader } from "lib/config-reader";
import {Outline} from "lib/outline";

export abstract class Integration {
  constructor(public id: string, public name: string, public config: ConfigReader) {

  }

  abstract bindEvents(outline: Outline, cursor: Cursor): void;
}
