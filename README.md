# stack-snippet-console
Creates an output console in the results pane of Stack-Snippets on the StackExchange network.

Notes:
- All calls to `console.log()` (`info()`, `warn()`, `error()`, and `clear()`)  are passed along to the actual console
- Loosely imitates Chrome's output (colors and styles excluded)
- Objects are printed using a variation of `JSON.stringify()` (including functions, regex, undefined, etc) with custom handling for `HTMLElement`
- Works by injecting elements into the page... so, it obviously pollutes the DOM.
- The number of entries is now limited to 50 by default. You can modify this limit by calling `console.config({maxEntries:25})`. Older entries will be removed to make room for newer entries.
- Logs unhandled errors.
- Handles circular references.