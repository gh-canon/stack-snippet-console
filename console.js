// MIT License, see: https://github.com/gh-canon/stack-snippet-console/blob/master/LICENSE

(() => {

    if (!console) window.console = {};

    /* original function references */
    const _assert = console.assert;
    const _dir = console.dir;
    const _log = console.log;
    const _info = console.info;
    const _error = console.error;
    const _warn = console.warn;
    const _clear = console.clear;
    const _time = console.time;
    const _timeEnd = console.timeEnd;
    const _count = console.count;
    const _dirxml = console.dirxml;

    const timeKeeper = {};
    const countKeeper = {};

    const wrapper = document.createElement("div");
    const div = document.createElement("div");
    const style = document.createElement("style");

    /* settings */
    let maxEntries = 50;
    let maximized = false;
    let autoScroll = true;

    wrapper.className = "as-console-wrapper as-console-timestamps";
    div.className = "as-console";

    document.body.appendChild(wrapper).appendChild(div);

    style.type = "text/css";
    style.textContent = [
        ".as-console-wrapper { position: fixed; bottom: 0; left: 0; right: 0; max-height: 150px; overflow-y: scroll; overflow-x: hidden; border-top: 1px solid #000; display: none; background: #fff; }",
        ".as-console-wrapper.as-console-maximized { top: 0px; max-height: inherit; display:block; background: #fff; border-top: none;  }",
        ".as-console { border: 1px solid #ccc; display: table; width: 100%; border-collapse: collapse; }",
        ".as-console-row { display: table-row; font-family: monospace; font-size: 10pt; }",
        ".as-console-timestamps .as-console-row:after { display: table-cell; padding: 3px 6px; color: rgba(0,0,0,.35); border: 1px solid #ccc; content: attr(data-date); vertical-align: top; }",
        ".as-console-row + .as-console-row > * { border: 1px solid #ccc; }",
        ".as-console-row-code { width: 100%; white-space: pre-wrap; padding: 3px 5px; display: table-cell; font-family: monospace; font-size: 13px; vertical-align: middle; }",
        ".as-console-error:before { content: 'Error: '; color: #f00; }",
        ".as-console-assert:before { content: 'Assertion failed: '; color: #f00; }",
        ".as-console-info:before { content: 'Info: '; color: #00f; }",
        ".as-console-warning:before { content: 'Warning: '; color: #e90 }",
        "@-webkit-keyframes flash { 0% { background: rgba(255,240,0,.25); } 100% { background: none; } }",
        "@-moz-keyframes flash { 0% { background: rgba(255,240,0,.25); } 100% { background: none; } }",
        "@-ms-keyframes flash { 0% { background: rgba(255,240,0,.25); } 100% { background: none; } }",
        "@keyframes flash { 0% { background: rgba(255,240,0,.25); } 100% { background: none; } }",
        ".as-console-row-code, .as-console-row:after { -webkit-animation: flash 1s; -moz-animation: flash 1s; -ms-animation: flash 1s; animation: flash 1s; }",
        ".as-console-dictionary { margin: 0; padding: 0 0 0 20px; background-color: #fff; list-style: none; white-space: normal; }",
        ".as-console-dictionary-entry { display: flex; flex-direction: row; }",
        ".as-console-dictionary-label { color: #C0C; }",
        ".as-console-dictionary-label::after { content: ':'; margin-right: 6px; }",
        ".as-console-expandable-value { cursor: default; white-space: nowrap; }",
        ".as-console-expandable-value::before { content: ''; display: inline-block; margin: 0 4px 0 0; width: 8.316px; height: 7.2px; background-size: 100%; background-repeat: no-repeat; background-position: center center; background-image: url('data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iMTMuODU2cHgiIGhlaWdodD0iMTJweCIgdmlld0JveD0iMCAwIDEzLjg1NiAxMiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTMuODU2IDEyIj48cG9seWdvbiBmaWxsPSIjQ0NDQ0NDIiBwb2ludHM9IjEzLjg1NiwwIDYuOTI4LDEyIDAsMCAiLz48L3N2Zz4='); }",
        ".as-console-collapsed-value::before { transform-origin: center center; transform: rotate(-90deg); margin: 0 4px 1px 0;  }",
        ".as-console-collapsed-value .as-console-dictionary { display: none; }",
        ".as-console-ellipsis { display: none; }",
        ".as-console-collapsed-value .as-console-ellipsis { display: inline; }",
        ".as-console-type-label, .as-console-nil-value { color: #808080; }",
        ".as-console-literal-value, .as-console-string-value { color: #C00; }",
        ".as-console-string-value::before, .as-console-string-value::after { content: '\"'; color: #000; }",
        ".as-console-keyword { color: #00F; }",
        ".as-console-non-enumerable-value .as-console-dictionary-label { color: #DAD; }",
        ".as-console-function-preview { font-style: italic; }"
    ].join("\n");

    document.head.appendChild(style);

    function formatDate(d) {
        d = new Date(d.valueOf() - d.getTimezoneOffset() * 60000);
        let result = d.toISOString().replace("Z", "").replace("T", " ");
        return result;
    }

    function flushMessageBuffer(buffer, messasge) {
        if (buffer.length) {
            messasge.appendChild(document.createTextNode(buffer.join("")));
            buffer.splice(0);
        }
    }

    let domify = (() => {

        const domValueMap = new WeakMap();

        function toggleExpansion(e) {
            if (e.target === this || (e.target.parentNode === this && e.target.tagName !== "UL")) {

                if (this.classList.contains("as-console-collapsed-value")) {
                    this.classList.remove("as-console-collapsed-value")
                    this.classList.add("as-console-expanded-value")
                } else {
                    this.classList.remove("as-console-expanded-value")
                    this.classList.add("as-console-collapsed-value")
                }
            }
        }

        function getPropertyEntry(name, value, enumerable) {
            let li = document.createElement("li");
            li.classList.add("as-console-dictionary-entry");
            if (!enumerable) {
                li.classList.add("as-console-non-enumerable-value");
            }
            let span = document.createElement("span");
            span.classList.add("as-console-dictionary-label");
            span.textContent = name;
            li.appendChild(span);
            span = document.createElement("span");
            span.classList.add("as-console-dictionary-value");
            try {
                span.appendChild(domify(value));
            } catch (err) {
                span.textContent = err.message;
                span.classList.add("as-console-error");
            }
            li.appendChild(span);
            return li;
        }

        function expandObjectDom() {

            let span,
                li,
                value = domValueMap.get(this),
                ul = document.createElement("ul");

            ul.classList.add("as-console-dictionary");

            let descriptors = (descriptors => {
                let properties = [];
                for (let name in descriptors) {
                    let descriptor = descriptors[name];
                    descriptor.name = name;
                    properties.push(descriptor);
                }
                return properties;
            })(Object.getOwnPropertyDescriptors(value));

            let rxNumeric = /^[0-9]+$/;

            descriptors.sort((a, b) => {
                if (a.enumerable && !b.enumerable) {
                    return -1;
                } else if (b.enumerable && !a.enumerable) {
                    return 1;
                } else {
                    let aVal = rxNumeric.test(a.name) ? parseInt(a.name, 10) : a.name,
                        bVal = rxNumeric.test(b.name) ? parseInt(b.name, 10) : b.name;                
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }
            });

            for (let descriptor of descriptors) {
                ul.appendChild(getPropertyEntry(descriptor.name, value[descriptor.name], descriptor.enumerable));
            }
            
            if (typeof value !== "function") {
                let proto = Object.getPrototypeOf(value);
                if (proto) {
                    ul.appendChild(getPropertyEntry("__proto__", proto, false));
                }
            }

            this.classList.remove("as-console-collapsed-value");
            this.classList.add("as-console-expanded-value");
            this.insertBefore(ul, this.lastElementChild);
            this.removeEventListener("click", expandObjectDom);
            this.addEventListener("click", toggleExpansion);
        }

        function getArgs(func) /* source: humbletim @ https://stackoverflow.com/a/31194949/621962 */ {
            return Function.prototype.toString.call(func)
                .replace(/[/][/].*$/mg, '') // strip single-line comments
                .replace(/\s+/g, '') // strip white space
                .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  
                .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters  
                .replace(/=[^,]+/g, '') // strip any ES6 defaults  
                .split(',').filter(Boolean); // split & filter [""]
        }

        return function domify(value, config) {

            config = config || {};

            let type = Object.prototype.toString.call(value).slice(8, -1),
                span = document.createElement("span");

            span.classList.add("as-console-value");            

            switch (type) {
                case 'Null':
                case 'Undefined':
                    span.textContent = String(value);
                    span.classList.add("as-console-nil-value");
                    break;
                case 'RegExp':
                    span.classList.add("as-console-literal-value");
                    span.textContent = String(value);
                    break;
                case 'String':
                    span.textContent = value;
                    if (!config.noStyle) {
                        span.classList.add("as-console-string-value");
                    }
                    break;
                case 'Boolean':
                case 'Number':
                    span.textContent = String(value);
                    span.classList.add("as-console-keyword");
                    break;
                default:
                    let caps = type === "Array" ? "[]" : "{}";
                    if (typeof value === "function") {
                        let functionSymbol = document.createElement("span");
                        functionSymbol.textContent = "ƒ "
                        functionSymbol.classList.add("as-console-keyword");
                        span.appendChild(functionSymbol);
                        let functionPreview = document.createElement("span");
                        functionPreview.classList.add("as-console-function-preview");
                        functionPreview.textContent = `${value.name}(${getArgs(value).join(", ")})`;
                        span.appendChild(functionPreview)
                    } else if (type === "Date") {
                        let typeLabel = document.createElement("span");
                        typeLabel.textContent = formatDate(value);
                        typeLabel.classList.add("as-console-type-label");
                        span.appendChild(typeLabel);
                    } else {
                        let typeLabel = document.createElement("span");
                        typeLabel.textContent = type;
                        typeLabel.classList.add("as-console-type-label");
                        span.appendChild(typeLabel);
                    }
                    span.classList.add("as-console-collapsed-value");
                    domValueMap.set(span, value);
                    span.appendChild(document.createTextNode(` ${caps[0]}`));
                    let ellipsis = document.createElement("span");
                    ellipsis.textContent = "…";
                    ellipsis.classList.add("as-console-ellipsis");
                    span.appendChild(ellipsis);
                    span.classList.add("as-console-expandable-value");
                    span.addEventListener("click", expandObjectDom);
                    span.appendChild(document.createTextNode(caps[1]));
                    break;
            }

            return span;
        }
    })();

    function format(formatString, ...args) {

        let message = document.createDocumentFragment();

        let buffer = [];

        let escaped = false;

        let argumentIndex = 0;

        Array.prototype.forEach.call(formatString, (char, index) => {
            if (char === "%" && !escaped) {
                escaped = true;
            } else {
                if (escaped) {
                    escaped = false;
                    switch (char) {
                        case "%":
                            buffer.push("%");
                            break;
                        case "d":
                        case "i":                            
                            flushMessageBuffer(buffer, message);
                            message.appendChild(domify(Math.floor(args[argumentIndex++])));
                            break;
                        case "o":
                        case "O":
                            flushMessageBuffer(buffer, message);
                            message.appendChild(domify(args[argumentIndex++]));
                            break;
                        case "s":
                            flushMessageBuffer(buffer, message);
                            message.appendChild(domify(args[argumentIndex++], { noStyle: true }));
                            break;
                    }
                } else {
                    buffer.push(char);
                }
            }
        });

        flushMessageBuffer(buffer, message);

        return message;
    }

    function truncateEntries() {
        if (maxEntries < 0) return;
        while (div.childNodes.length > maxEntries) {
            div.removeChild(div.firstChild);
        }
    }

    function createLogEntry(...args) {

        let row = document.createElement("div");
        row.className = "as-console-row";

        row.setAttribute("data-date", formatDate(new Date()).slice(11));

        let code = row.appendChild(document.createElement("code"));
        code.className = "as-console-row-code";

        if (typeof args[0] === "string" && args.length > 1 && /((^|[^%])%[sdifoO])/.test(args[0])) {
            code.appendChild(format(...args));
        } else {
            args.forEach((arg, i) => {
                if (i > 0) {
                    code.appendChild(document.createTextNode(" "));
                }
                code.appendChild(domify(arg));
            });
        }

        row.appendChild(code);

        div.appendChild(row);

        truncateEntries();

        if (autoScroll) wrapper.scrollTop = row.offsetTop;

        return row;
    }

    function showConsole(show) {
        if (maximized) return;
        wrapper.style.display = show ? "block" : "none";
    }

    console.log = function (...args) {

        _log && _log.apply(console, args);

        if (!args.length) return;

        createLogEntry(...args);

        showConsole(1);

    };

    console.warn = function (...args) {

        _warn && _warn.apply(console, args);

        if (!args.length) return;

        createLogEntry(...args)
            .children[0].classList.add("as-console-warning");

        showConsole(1);

    };

    console.info = function () {

        let args = arguments;

        _info && _info.apply(console, args);

        if (!args.length) return;

        createLogEntry(...args)
            .children[0].classList.add("as-console-info");

        showConsole(1);

    };

    console.error = function (...args) {

        _error && _error.apply(console, args);

        if (!args.length) return;

        let entry;
        let e = args[0];

        if (e instanceof Error) {
            entry = createLogEntry({
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        } else {
            entry = createLogEntry(...args)
        }

        entry.children[0].classList.add("as-console-error");

        showConsole(1);

    };

    console.assert = function (...args) {

        _assert && _assert.apply(console, args);

        if (!args[0]) {
            let entry = createLogEntry(...args.slice(1));

            entry.children[0].classList.add("as-console-assert");

            showConsole(1);
        }
    };

    console.dir = function (...args) {

        _dir && _dir.apply(console, args);

        if (!args.length) return;

        createLogEntry(args[0]);

        showConsole(1);
    };

    console.dirxml = function () {

        let args = arguments;

        _dirxml && _dirxml.apply(console, args);

        if (!args.length) return;

        let output = args[0];

        let serializer = new XMLSerializer();

        output = serializer.serializeToString(output);

        createLogEntry("%s", output);

        showConsole(1);
    };

    console.clear = function () {

        while (div.lastChild) {
            div.removeChild(div.lastChild);
        }

        _clear && _clear.apply(console, arguments);

        showConsole(0);
    };

    console.time = function (label) {

        const now = performance.now();

        _time && _time.apply(console, arguments)

        if (!arguments.length) label = "default";

        timeKeeper[label] = now;
    };

    console.timeEnd = function (label) {

        const now = performance.now();

        _timeEnd && _timeEnd.apply(console, arguments)

        if (!arguments.length) label = "default";

        if (!(label in timeKeeper)) return;

        let diff = now - timeKeeper[label];

        delete timeKeeper[label];

        createLogEntry("%s: %sms", label, diff.toFixed(3));

        showConsole(1);

    };

    console.count = function (label) {

        _count && _count.apply(console, arguments)

        if (!arguments.length) label = "";

        let count = 1;

        if (label in countKeeper) {
            count = ++countKeeper[label];
        } else {
            countKeeper[label] = count;
        }

        createLogEntry("%s: %i", label, count);

        showConsole(1);
    };

    console.config = function (settings) {
        if (!settings && typeof settings !== "object") return;

        if ("maxEntries" in settings && settings.maxEntries) {
            let _maxEntries = Number(settings.maxEntries);
            if (!isNaN(maxEntries)) {
                maxEntries = _maxEntries;
                truncateEntries();
            }
        }

        if ("maximize" in settings) {
            if (settings.maximize) {
                wrapper.classList.add("as-console-maximized");
                maximized = true;
            } else {
                wrapper.classList.remove("as-console-maximized");
                maximized = false;
                showConsole(div.children.length);
            }
        }

        if ("autoScroll" in settings) {
            autoScroll = settings.autoScroll == true;
        }

        if ("timeStamps" in settings) {
            if (settings.timeStamps) {
                wrapper.classList.add("as-console-timestamps");
            } else {
                wrapper.classList.remove("as-console-timestamps");
            }
        }
    };

    window.addEventListener("error", function (e) {
        createLogEntry({
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno
        }).children[0].classList.add("as-console-error");

        showConsole(1);
    });

})();