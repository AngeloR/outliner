import type {ApiClient} from "api"
import type {Cursor} from "cursor"
import { ConfigReader } from "lib/config-reader"
import type {Outline} from "lib/outline"
import type {Search} from "modals/search"

export type KeyEventActionHandlerArgs = {
  e: keyboardJS.KeyEvent,
  outline: Outline,
  cursor: Cursor,
  api: ApiClient,
  search: Search,
  config: ConfigReader
}

export type KeyEventDefinition = {
  context: 'navigation' | 'search' | 'editing'
  keys: string[],
  description: string,
  action: (args: KeyEventActionHandlerArgs) => void;
}
