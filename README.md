# stack-snippet-console
A simple console visualizer for the DOM. Intercepts console logging calls and routes the output to both the DOM and the console.

This was developed for use in Stack-Snippets on the StackExchange network; though, it should be widely applicable.

Notes:
- All calls to `console.log()` (`info()`, `warn()`, `error()`, and `clear()`)  are passed along to the actual console
- Loosely imitates Chrome's output (colors and styles excluded)
- Objects are printed using a variation of `JSON.stringify()` (including functions, regex, undefined, etc) with custom handling for `HTMLElement`
- Works by injecting elements into the page... so, it obviously pollutes the DOM.
- The number of entries is now limited to 50 by default. You can modify this limit by calling `console.config({maxEntries:25})`. Older entries will be removed to make room for newer entries.
- Logs unhandled errors.
- Handles circular references.