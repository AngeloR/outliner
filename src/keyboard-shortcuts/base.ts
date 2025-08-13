import type { ApiClient } from "api"
import type { Cursor } from "cursor"
import type { Outline } from "lib/outline"
import type { Search } from "modals/search"

export type KeyEventActionHandlerArgs = {
  e: keyboardJS.KeyEvent,
  outline: Outline,
  cursor: Cursor,
  api: ApiClient,
  search: Search
}

export type KeyEventDefinition = {
  context: 'navigation' | 'search' | 'editing'
  keys: string[],
  description: string,
  action: (args: KeyEventActionHandlerArgs) => Promise<void>;
}
