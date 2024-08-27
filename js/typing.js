Typed.prototype.typewrite = function(curString, curStrPos) {
    var humanize = Math.round(Math.random() * (100 - 30)) + 30; // Random speed between 30 and 100 ms
    var self = this;

    setTimeout(function() {
        var charPause = 0;
        var substr = curString.substr(curStrPos);
        if (substr.charAt(0) === '^') {
            var skip = 1; // skip at least 1
            if (/^\^\d+/.test(substr)) {
                substr = /\d+/.exec(substr)[0];
                skip += substr.length;
                charPause = parseInt(substr);
            }
            curString = curString.substring(0, curStrPos) + curString.substring(curStrPos + skip);
        }

        if (self.contentType === 'html') {
            if (curString.charAt(curStrPos) === '<' || curString.charAt(curStrPos) === '&') {
                let tag = '';
                let endTag;
                if (curString.charAt(curStrPos) === '<') {
                    endTag = '>';
                } else {
                    endTag = ';';
                }
                while (curString.charAt(curStrPos + 1) !== endTag) {
                    tag += curString.charAt(curStrPos);
                    curStrPos++;
                }
                curStrPos++;
            }
        }

        self.timeout = setTimeout(function() {
            if (curStrPos === curString.length) {
                self.options.onStringTyped(self.arrayPos, self);
                self.timeout = setTimeout(function() {
                    self.backspace(curString, curStrPos);
                }, self.backDelay);
            } else {
                if (curStrPos === 0) self.options.preStringTyped(self.arrayPos, self);
                var nextString = curString.substr(0, curStrPos + 1);
                if (self.attr) {
                    self.el.setAttribute(self.attr, nextString);
                } else {
                    if (self.isInput) {
                        self.el.value = nextString;
                    } else if (self.contentType === 'html') {
                        self.el.innerHTML = nextString;
                    } else {
                        self.el.textContent = nextString;
                    }
                }
                curStrPos++;
                self.typewrite(curString, curStrPos);
            }
        }, charPause + humanize);
    }, humanize);
};

// Override the backspace method
Typed.prototype.backspace = function(curString, curStrPos) {
    var humanize = Math.round(Math.random() * (100 - 30)) + 30; // Random speed between 30 and 100 ms
    var self = this;

    setTimeout(function() {
        if (self.contentType === 'html') {
            if (curString.charAt(curStrPos - 1) === '>') {
                var tag = '';
                while (curString.charAt(curStrPos - 1) !== '<') {
                    tag -= curString.charAt(curStrPos - 1);
                    curStrPos--;
                }
                curStrPos--;
            }
        }

        var nextString = curString.substr(0, curStrPos - 1);
        if (self.attr) {
            self.el.setAttribute(self.attr, nextString);
        } else {
            if (self.isInput) {
                self.el.value = nextString;
            } else if (self.contentType === 'html') {
                self.el.innerHTML = nextString;
            } else {
                self.el.textContent = nextString;
            }
        }

        if (curStrPos > 0) {
            curStrPos--;
            self.backspace(curString, curStrPos);
        } else {
            self.arrayPos++;
            if (self.arrayPos === self.strings.length) {
                self.arrayPos = 0;
                self.curLoop++;
                if (self.loop === false || self.curLoop === self.loopCount) return;
            }
            self.typewrite(self.strings[self.arrayPos], 0);
        }
    }, humanize);
};

var typed = new Typed('.auto-type', {
    strings: ['rmasjonsteknologi<br>VG2'],
    typeSpeed: 50,
    backSpeed: 50,
    backDelay: 1000,
    startDelay: 1000,
    loop: true,
    showCursor: true,
    attr: null,
    contentType: 'html'
});