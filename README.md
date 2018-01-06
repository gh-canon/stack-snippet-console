# stack-snippet-console
A simple console visualizer for the DOM. Intercepts console logging calls and routes the output to both the DOM and the console.

This was developed for use in Stack-Snippets on the StackExchange network; though, it should be widely applicable.

Notes:
- All calls to `console.log()` (`info()`, `warn()`, `error()`, and `clear()`)  are passed along to the actual console
- Loosely imitates Chrome's output
- Objects are rendered in a lazy-evaluated tree-view
- Works by injecting elements into the page... so, it obviously pollutes the DOM.
- The number of entries is now limited to 50 by default. You can modify this limit by calling `console.config({maxEntries:25})`. Older entries will be removed to make room for newer entries.
- Logs unhandled errors.