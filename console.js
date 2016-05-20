// MIT License, see: https://github.com/gh-canon/stack-snippet-console/blob/master/LICENSE

(function () {    

    if (!console) window.console = {};

    var _assert = console.assert;
    var _dir = console.dir;
    var _log = console.log;
    var _info = console.info;
    var _error = console.error;
    var _warn = console.warn;
    var _clear = console.clear;
    var _time = console.time;
    var _timeEnd = console.timeEnd;
    var timeKeeper = {};
    var wrapper = document.createElement("div");
    var div = document.createElement("div");
    var style = document.createElement("style");
    var maxEntries = 50;

    wrapper.className = "as-console-wrapper";
    div.className = "as-console";

    document.body.appendChild(wrapper).appendChild(div);

    style.type = "text/css";
    style.textContent = [
    ".as-console-wrapper { position: fixed; bottom: 0; left: 0; right: 0; max-height: 150px; overflow-y: scroll; overflow-x: hidden; border-top: 1px solid #000; display: none; }",
    ".as-console { background: #e9e9e9; border: 1px solid #ccc; display: table; width: 100%; border-collapse: collapse; }",
    ".as-console-row { display: table-row; font-family: monospace; font-size: 13px; }",
    ".as-console-row:after { display: table-cell; padding: 3px 6px; color: rgba(0,0,0,.35); border: 1px solid #ccc; content: attr(data-date); vertical-align: top; }",
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
    ".as-console-row-code, .as-console-row:after { -webkit-animation: flash 1s; -moz-animation: flash 1s; -ms-animation: flash 1s; animation: flash 1s; }"].join("\n");

    document.head.appendChild(style);

    var stringifier = (function () {

        // Largely borrowed from Douglas Crockford's json2.js https://github.com/douglascrockford/JSON-js/blob/master/json2.js
        // Modified because we're more concerned with visualization than data interchange

        var rx_one = /^[\],:{}\s]*$/,
            rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
            rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
            rx_four = /(?:^|:|,)(?:\s*\[)+/g,
            rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

        function f(n) {
            return n < 10
                ? '0' + n
                : n;
        }

        function this_value() {
            return this.valueOf();
        }

        var gap,
            indent,
            meta = {
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            },
            map,
            id;

        function quote(string) {
            rx_escapable.lastIndex = 0;
            return rx_escapable.test(string)
                ? '"' + string.replace(rx_escapable, function (a) {
                    var c = meta[a];
                    return typeof c === 'string'
                        ? c
                        : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                }) + '"'
                : '"' + string + '"';
        }

        function getProps(obj) {
            var props = [];

            do {
                for (var prop in obj) {
                    if (props.indexOf(prop) === -1) {
                        props.push(prop);
                    }
                }
            }
            while (obj = obj.__proto__);

            return props;
        }

        function strElement(element) {

            var tagName = element.tagName.toLowerCase();

            var str = "<" + tagName;

            if (element.attributes.length > 0) {
                str += " ";
            }

            str += Array.prototype.map.call(element.attributes, function (a) {
                if (a.value === "") {
                    return a.name;
                }
                return a.name + '=' + quote(a.value);
            }).join(" ");

            str += ">";

            if (element.children.length || element.textContent.length > 79) {
                str += "\u2026"; // ellipsis
            } else {
                str += element.textContent;
            }

            str += "</" + tagName + ">";

            return str;
        }

        function str(key, holder) {

            var i,
                k,
                v,
                length,
                mind = gap,
                partial,
                value,
                anchor;

            try {
                value = holder[key];

                if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
                    value = value.toJSON(key);
                }

                if (value instanceof HTMLElement) {
                    return strElement(value);
                }

                if (value instanceof RegExp) {
                    return String(value);
                }

                if (value instanceof MimeType || value instanceof Plugin) {
                    // Chrome issue(?): As these objects are nested, completely new versions of the same object are (seemingly) generated.
                    // So, our reference tracking won't track them properly.
                    return Object.prototype.toString.call(value);
                }

                switch (typeof value) {
                    case 'string':

                        return quote(value);

                    case 'boolean':                    
                    case 'null':
                    case 'number':
                    case 'undefined':

                        return String(value);

                    case 'function':
                    case 'object':

                        if (!value) {
                            return 'null';
                        }

                        var _id = map.indexOf(value) + 1;

                        if (_id > 0) {
                            return "/**ref:" + _id.toString(16) + "**/";
                        } else {                            
                            map.push(value);
                            _id = map.length;
                            anchor = "/**id:" + _id.toString(16) + "**/";                                                        
                        }

                        if (typeof value === "function") {
                            return anchor + " " + String(value);
                        }

                        gap += indent;
                        partial = [];

                        if (Object.prototype.toString.apply(value) === '[object Array]') {

                            length = value.length;
                            for (i = 0; i < length; i += 1) {
                                partial[i] = str(i, value) || 'null';
                            }

                            v = partial.length === 0
                                ? '[]'
                                : '[\n' + gap + anchor + "\n" + gap + partial.join(',\n' + gap) + '\n' + mind + ']';
                            gap = mind;
                            return v;
                        }

                        getProps(value).forEach(function (k) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + ': ' + v);
                            }
                        });

                        v = partial.length === 0
                            ? '{}'
                            : '{\n' + gap + anchor + "\n" + gap + partial.join(',\n' + gap) + '\n' + mind + '}';
                        gap = mind;

                        return v;
                }

            } catch (err) {
                _error.call(console, err);
                return "/**error accessing property**/";
            }
        }

        function getString (value) {

            if (typeof value === "string") return value;

            gap = '';
            indent = '  ';
            map = [];

            var returnVal = str('', { '': value });

            var n = map.length;

            while (n) {
                if (!new RegExp("/\\*\\*ref:" + n.toString(16) + "\\*\\*/").test(returnVal)) {
                    returnVal = returnVal.replace(new RegExp("[\r\n\t ]*/\\*\\*id:" + n.toString(16) + "\\*\\*/", "g"), "");
                }
                n--;
            }

            map = null;

            return returnVal;
        };

        return {
            quote: quote,
            getString: getString
        };

    })();

    function formatDate(d) {
        d = new Date(d.valueOf() - d.getTimezoneOffset() * 60000);
        var result = d.toISOString().replace("Z", "");
        return result.substring(result.indexOf("T") + 1);
    }

    function format() {
        var i = 0,
            val,
            args = arguments;

        return args[0].replace(/(%?%[sdifoO])/g, function (c) {            

            if (c.length === 3) return c;

            val = args[++i];

            if (val == null) {
                return "" + val;
            }

            switch (c.charAt(1)) {
                case "s":
                    return val;
                case "d":
                case "i":
                    return typeof val === "number" ? Math.floor(val) : "NaN";
                case "f":
                    return typeof val === "number" ? val : "NaN";
                default:
                    if (typeof val === "string") {
                        return stringifier.quote(val);
                    } else {
                        return stringifier.getString(val);
                    }
            }
        });
    }

    function truncateEntries() {
        while (div.childNodes.length > maxEntries) {
            div.removeChild(div.firstChild);
        }
    }

    function createLogEntry() {

        var args = arguments;

        var row = document.createElement("div");
        row.className = "as-console-row";

        row.setAttribute("data-date", formatDate(new Date()));

        var code = row.appendChild(document.createElement("code"));
        code.className = "as-console-row-code";

        if (typeof args[0] === "string" && args.length > 1 && /((^|[^%])%[sdifoO])/.test(args[0])) {
            code.textContent = format.apply(null, args);
        } else {
            code.textContent = [].map.call(args, stringifier.getString).join(" ");
        }

        div.appendChild(row);

        truncateEntries();

        wrapper.scrollTop = row.offsetTop;

        return row;
    }

    function showConsole(show) {
        wrapper.style.display = show ? "block" : "none";
    }

    console.log = function () {

        var args = arguments;

        _log && _log.apply(console, args);

        if (!args.length) return;

        createLogEntry.apply(null, args);

        showConsole(1);

    };

    console.warn = function () {

        var args = arguments;

        _warn && _warn.apply(console, args);

        if (!args.length) return;

        createLogEntry.apply(null, args)
            .children[0].classList.add("as-console-warning");

        showConsole(1);

    };

    console.info = function () {

        var args = arguments;

        _info && _info.apply(console, args);

        if (!args.length) return;

        createLogEntry.apply(null, args)
            .children[0].classList.add("as-console-info");

        showConsole(1);

    };

    console.error = function () {

        var args = arguments;

        _error && _error.apply(console, args);

        if (!args.length) return;

        var entry;
        var e = args[0];

        if (e instanceof Error) {
            entry = createLogEntry({
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        } else {
            entry = createLogEntry.apply(null, args)
        }

        entry.children[0].classList.add("as-console-error");

        showConsole(1);

    };

    console.assert = function () {

        var args = arguments;

        _assert && _assert.apply(console, args);

        if (!args[0]) {
            var entry = createLogEntry.apply(null, Array.prototype.slice.call(args, 1));

            entry.children[0].classList.add("as-console-assert");

            showConsole(1);
        }
    };

    console.dir = function () {

        var args = arguments;

        _dir && _dir.apply(console, args);

        if (!args.length) return;

        createLogEntry(args[0]);

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

        var now = performance.now();

        _time && _time.apply(console, arguments)              
        
        if (!arguments.length) label = "default";

        timeKeeper[label] = now;
    };

    console.timeEnd = function (label) {

        var now = performance.now();

        _timeEnd && _timeEnd.apply(console, arguments)

        if (!arguments.length) label = "default";        

        var prev = timeKeeper[label];

        if (!prev) return;

        var diff = now - prev;

        delete timeKeeper[label];        

        createLogEntry("%s: %sms", label, diff.toFixed(3));

        showConsole(1);

    };

    console.config = function (settings) {

        if (typeof settings === "object") {

            if (settings.maxEntries > 0) {
                maxEntries = settings.maxEntries;
                truncateEntries();
            }
        }

        console.log({
            maxEntries: maxEntries
        });
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