(function () {
    function OrientationTester(container, orientation) {
        this.container = container;
        this.setOrientation(orientation);
    }
    extend(OrientationTester.prototype, {
        setOrientation: function (orientation) {
            this.orientation = orientation;
            if (orientation == "R") {
                this.advanceExpected = 8;
                this.advanceFailed = 4;
            } else {
                this.advanceExpected = 4;
                this.advanceFailed = 8;
            }
        },
        measure: function () {
            var nodes = this.container.childNodes;
            for (var i = 0; i < nodes.length; i++)
                this._measureNode(nodes[i]);
        },
        _measureNode: function (node) {
            switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                var nodes = node.childNodes;
                for (var i = 0; i < nodes.length; i++)
                    this._measureNode(nodes[i]);
                return;
            case Node.TEXT_NODE:
                break;
            default:
                return;
            }

            var range = document.createRange();
            var text = node.textContent;
            for (var ich = 0; ich < text.length; ich++) {
                var code = text.charCodeAt(ich);
                if (code == 10 || code == 13)
                    continue;
                range.setStart(node, ich);
                range.setEnd(node, ich + 1);
                rect = range.getBoundingClientRect();
                if (rect.width == 16) {
                    if (rect.height == this.advanceExpected) {
                        this.results.passCount++;
                        continue;
                    }
                    //log("U+" + stringFromUnicode(code) + " " + rect.width + "x" + rect.height);
                    if (rect.height == this.advanceFailed) {
                        this.results.failed(this, code);
                        continue;
                    }
                }
                this.results.inconclusive(this, code, rect);
            }
        }});

    function Results(name) {
        appendChildElement(details, "h3", name);
        this.list = appendChildElement(details, "ol");
        this.passCount = 0;
        this.failCount = 0;
        this.inconclusiveCount = 0;
    }
    extend(Results.prototype, {
        failed: function (test, code) {
            this.failCount++;
            this.append(test, code);
        },
        inconclusive: function (test, code, rect) {
            this.inconclusiveCount++;
            this.append(test, code, " but inconclusive (rendered as " + rect.width + "x" + rect.height + ")");
        },
        append: function (test, code, message) {
            var text = stringFromUnicode(code) + " should be " + test.orientation;
            if (message)
                text += message;
            appendChildElement(this.list, "li", text);
        }});

    function Runner() {
        var nodes = document.querySelectorAll("div[data-vo]");
        this.testers = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var vo = node.dataset.vo;
            var tester = new OrientationTester(node, vo);
            tester.test = async_test("Default orientation for vo=" + vo);
            this.testers.push(tester);
        }
        this.testU = async_test("Orientation=Upright");
        this.testR = async_test("Orientation=Rotated");
    }
    extend(Runner.prototype, {
        run: function () {
            log("Started");
            var start = new Date;
            var me = this;

            for (var tester of this.testers) {
                var test = tester.test;
                test.step(function () {
                    var results = new Results(test.name);
                    me.runCore(tester, test, results);
                    me.done(test, results);
                });
            }
            this.runOrientation(this.testU, "U");
            this.runOrientation(this.testR, "R");

            log("Elapsed " + (new Date() - start));
            done();
        },
        runOrientation: function (test, orientation) {
            container.classList.add(orientation);
            var results = new Results(test.name);
            var me = this;
            test.step(function () {
                for (var tester of me.testers) {
                    tester.setOrientation(orientation);
                    me.runCore(tester, test, results);
                }
                me.done(test, results);
            })
            container.classList.remove(orientation);
        },
        runCore: function (tester, test, results) {
            tester.results = results;
            test.step(function () {
                tester.measure();
            });
        },
        done: function (test, results) {
            if (results.inconclusiveCount)
                test.name += " (" + results.inconclusiveCount + " inconclusive)";
            assert_equals(results.failCount, 0, "Fail count");
            assert_greater_than(results.passCount, 0, "Pass count");
            test.done();
        }});

    setup({explicit_done:true, explicit_timeout:true});
    var runner = new Runner();
    window.onload = function () {
        if (window.location.hash == "#wait") {
            log("Waiting for 5 secs");
            return setTimeout(run, 5000);
        }
        run();
    }

    function run() {
        onFontReady("16px orientation", function () { runner.run(); });
    }

    function onFontReady(font, func) {
        log("Waiting test fonts to load");
        if (document.fonts) {
            if ('load' in document.fonts)
                return document.fonts.load(font).then(func);
            if ('ready' in document.fonts)
                return document.fonts.ready.then(func);
        }
        document.offsetTop; // last resort to load @font-face
        func();
    }

    function stringFromUnicode(code) {
        var hex = "0000" + code.toString(16).toUpperCase();
        hex = hex.substr(hex.length - 4);
        return hex + ' "' + String.fromCharCode(code) + '"';
    }

    function appendChildElement(parent, tag, text) {
        var node = document.createElement(tag);
        if (text)
            node.textContent = text;
        parent.appendChild(node);
        return node;
    }

    function extend(target, dict) {
        for (var key in dict)
            target[key] = dict[key];
    }

    function log(text) {
        console.log(text);
    }
})();
