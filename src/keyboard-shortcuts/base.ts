import type {ApiClient} from "api"
import type {Cursor} from "cursor"
import type {Outline} from "lib/outline"

export type KeyEventActionHandlerArgs = {
  e: keyboardJS.KeyEvent,
  outline: Outline,
  cursor: Cursor,
  api: ApiClient
}

export type KeyEventDefinition = {
  context: 'navigation' | 'search'
  keys: string[],
  description: string,
  action: (args: KeyEventActionHandlerArgs) => void;
}
