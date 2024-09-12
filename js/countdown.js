const easing = {
    easeOutCubic: function(pos) {
        return (Math.pow((pos-1), 3) + 1);
    },
    easeOutQuart: function(pos) {
        return -(Math.pow((pos-1), 4) - 1);
    }
};

const breakList = ["Høstferie", "Juleferie", "Vinterferie", "Påskeferie", "Sommerferie"];

class ScrollSelector {
    constructor(options) {
        let defaults = {
            el: "",
            type: "infinite",
            count: 20,
            sensitivity: 0.8,
            source: [],
            value: null,
            onChange: null
        };

        this.options = Object.assign({}, defaults, options);
        this.options.count = this.options.count - this.options.count % 4;
        Object.assign(this, this.options);

        this.halfCount = this.options.count / 2;
        this.quarterCount = this.options.count / 4;
        this.a = this.options.sensitivity * 10;
        this.minV = Math.sqrt(1 / this.a);
        this.selected = this.source[0];

        this.exceedA = 10;
        this.moveT = 0;
        this.moving = false;

        this.elems = {
            el: document.querySelector(this.options.el),
            circleList: null,
            circleItems: null,

            highlight: null,
            highlightItems: null,
            highListItems: null
        };
        this.events = {
            touchstart: null,
            touchmove: null,
            touchend: null
        };

        this.itemHeight = this.elems.el.offsetHeight * 3 / this.options.count;
        this.itemAngle = 360 / this.options.count;
        this.radius = this.itemHeight / Math.tan(this.itemAngle * Math.PI / 180);

        this.scroll = 0;
        this._init();
    }

    _init() {
        this._create(this.options.source);

        let touchData = {
            startY: 0,
            yArr: []
        };

        for (let eventName in this.events) {
            this.events[eventName] = ((eventName) => {
                return (e) => {
                    if (this.elems.el.contains(e.target) || e.target === this.elems.el) {
                        e.preventDefault();
                        if (this.source.length) {
                            this["_" + eventName](e, touchData);
                        }
                    }
                }
            })(eventName);
        }

        this.elems.el.addEventListener("touchstart", this.events.touchstart);
        document.addEventListener("mousedown", this.events.touchstart);
        this.elems.el.addEventListener("touchend", this.events.touchend);
        document.addEventListener("mouseup", this.events.touchend);
        if (this.source.length) {
            this.value = this.value !== null ? this.value : this.source[0].value;
            this.select(this.value);
        }
    }

    _touchstart(e, touchData) {
        this.elems.el.addEventListener("touchmove", this.events.touchmove);
        document.addEventListener("mousemove", this.events.touchmove);
        let eventY = e.clientY || e.touches[0].clientY;
        touchData.startY = eventY;
        touchData.yArr = [[eventY, new Date().getTime()]];
        touchData.touchScroll = this.scroll;
        this._stop();
    }

    _touchmove(e, touchData) {
        let eventY = e.clientY || e.touches[0].clientY;
        touchData.yArr.push([eventY, new Date().getTime()]);
        if (touchData.length > 5) {
            touchData.unshift();
        }

        let scrollAdd = (touchData.startY - eventY) / this.itemHeight;
        let moveToScroll = scrollAdd + this.scroll;

        if (this.type === "normal") {
            if (moveToScroll < 0) {
                moveToScroll *= 0.3;
            } else if (moveToScroll > this.source.length) {
                moveToScroll = this.source.length + (moveToScroll - this.source.length) * 0.3;
            }
        } else {
            moveToScroll = this._normalizeScroll(moveToScroll);
        }

        touchData.touchScroll = this._moveTo(moveToScroll);
    }

    _touchend(e, touchData) {
        this.elems.el.removeEventListener("touchmove", this.events.touchmove);
        document.removeEventListener("mousemove", this.events.touchmove);

        let v;

        if (touchData.yArr.length === 1) {
            v = 0;
        } else {
            let startTime = touchData.yArr[touchData.yArr.length - 2][1];
            let endTime = touchData.yArr[touchData.yArr.length - 1][1];
            let startY = touchData.yArr[touchData.yArr.length - 2][0];
            let endY = touchData.yArr[touchData.yArr.length - 1][0];

            v = ((startY - endY) / this.itemHeight) * 1000 / (endTime - startTime);
            let sign = v > 0 ? 1 : -1;

            v = Math.abs(v) > 30 ? 30 * sign : v;
        }

        this.scroll = touchData.touchScroll;
        this._animateMoveByInitV(v);
    }

    _create(source) {
        if (!source.length) {
            return;
        }

        let template = `
          <div class="select-wrap">
            <ul class="select-options" style="transform: translate3d(0, 0, ${-this.radius}px) rotateX(0deg);">
              {{circleListHTML}}
            </ul>
            <div class="highlight">
              <ul class="highlight-list">
                {{highListHTML}}
              </ul>
            </div>
          </div>
        `;

        if (this.options.type === "infinite") {
            let concatSource = [].concat(source);
            while(concatSource.length > this.halfCount) {
                concatSource = concatSource.concat(source);
            }
            source = concatSource;
        }
        this.source = source;
        let sourceLength = source.length;

        let circleListHTML = "";
        for (let i = 0; i < source.length; i++) {
            circleListHTML += `<li class="select-option"
                    style="
                      top: ${this.itemHeight * -0.5}px;
                      height: ${this.itemHeight}px;
                      line-height: ${this.itemHeight}px;
                      transform: rotateX(${-this.itemAngle * i}deg) translate3d(0, 0, ${this.radius}px);
                    "
                    data-index="${i}"
                    >${source[i].text}</li>`;
        }

        let highListHTML = "";
        for (let i = 0; i < source.length; i++) {
            highListHTML += `<li class="highlight-item" style="height: ${this.itemHeight}px;">
                        ${source[i].text}
                      </li>`;
        }

        if (this.options.type === "infinite") {
            for (let i = 0; i < this.quarterCount; i++) {
                circleListHTML = `<li class="select-option"
                      style="
                        top: ${this.itemHeight * -0.5}px;
                        height: ${this.itemHeight}px;
                        line-height: ${this.itemHeight}px;
                        transform: rotateX(${this.itemAngle * (i + 1)}deg) translate3d(0, 0, ${this.radius}px);
                      "
                      data-index="${-i - 1}"
                      >${source[sourceLength - i - 1].text}</li>` + circleListHTML;
                circleListHTML += `<li class="select-option"
                      style="
                        top: ${this.itemHeight * -0.5}px;
                        height: ${this.itemHeight}px;
                        line-height: ${this.itemHeight}px;
                        transform: rotateX(${-this.itemAngle * (i + sourceLength)}deg) translate3d(0, 0, ${this.radius}px);
                      "
                      data-index="${i + sourceLength}"
                      >${source[i].text}</li>`;
            }

            highListHTML = `<li class="highlight-item" style="height: ${this.itemHeight}px;">
                          ${source[sourceLength - 1].text}
                      </li>` + highListHTML;
            highListHTML += `<li class="highlight-item" style="height: ${this.itemHeight}px;">${source[0].text}</li>`
        }

        this.elems.el.innerHTML = template
            .replace("{{circleListHTML}}", circleListHTML)
            .replace("{{highListHTML}}", highListHTML);
        this.elems.circleList = this.elems.el.querySelector(".select-options");
        this.elems.circleItems = this.elems.el.querySelectorAll(".select-option");

        this.elems.highlight = this.elems.el.querySelector(".highlight");
        this.elems.highlightList = this.elems.el.querySelector(".highlight-list");
        this.elems.highlightItems = this.elems.el.querySelectorAll(".highlight-item");

        if (this.type === "infinite") {
            this.elems.highlightList.style.top = this.itemHeight + "px";
        }

        this.elems.highlight.style.height = this.itemHeight + "px";
        this.elems.highlight.style.lineHeight = this.itemHeight + "px";
    }

    _normalizeScroll(scroll) {
        let normalizedScroll = scroll;

        while(normalizedScroll < 0) {
            normalizedScroll += this.source.length;
        }
        normalizedScroll = normalizedScroll % this.source.length;
        return normalizedScroll;
    }

    _moveTo(scroll) {
        if (this.type === "infinite") {
            scroll = this._normalizeScroll(scroll);
        }
        this.elems.circleList.style.transform = `translate3d(0, 0, ${-this.radius}px) rotateX(${this.itemAngle * scroll}deg)`;
        this.elems.highlightList.style.transform = `translate3d(0, ${-(scroll) * this.itemHeight}px, 0)`;

        [...this.elems.circleItems].forEach(itemElem => {
            if (Math.abs(itemElem.dataset.index - scroll) > this.quarterCount) {
                itemElem.style.visibility = "hidden";
            } else {
                itemElem.style.visibility = "visible";
            }
        });

        return scroll;
    }

    async _animateMoveByInitV(initV) {
        let initScroll;
        let finalScroll;
        let finalV;

        let totalScrollLen;
        let a;
        let t;

        if (this.type === "normal") {
            if (this.scroll < 0 || this.scroll > this.source.length - 1) {
                a = this.exceedA;
                initScroll = this.scroll;
                finalScroll = this.scroll < 0 ? 0 : this.source.length - 1;
                totalScrollLen = initScroll - finalScroll;

                t = Math.sqrt(Math.abs(totalScrollLen / a));
                initV = a * t;
                initV = this.scroll > 0 ? -initV : initV;
                finalV = 0;
                await this._animateToScroll(initScroll, finalScroll, t);
            } else {
                initScroll = this.scroll;
                a = initV > 0 ? -this.a : this.a;
                t = Math.abs(initV / a);
                totalScrollLen = initV * t + a * t * t / 2;
                finalScroll = Math.round(this.scroll + totalScrollLen);
                finalScroll = finalScroll < 0 ? 0 : (finalScroll > this.source.length - 1 ? this.source.length - 1 : finalScroll);

                totalScrollLen = finalScroll - initScroll;
                t = Math.sqrt(Math.abs(totalScrollLen / a));
                await this._animateToScroll(this.scroll, finalScroll, t, "easeOutQuart");
            }
        } else {
            initScroll = this.scroll;

            a = initV > 0 ? -this.a : this.a;
            t = Math.abs(initV / a);
            totalScrollLen = initV * t + a * t * t / 2;
            finalScroll = Math.round(this.scroll + totalScrollLen);
            await  this._animateToScroll(this.scroll, finalScroll, t, "easeOutQuart");
        }

        this._selectByScroll(this.scroll);
    }

    _animateToScroll(initScroll, finalScroll, t, easingName = "easeOutQuart") {
        if (initScroll === finalScroll || t === 0) {
            this._moveTo(initScroll);
            return;
        }

        let start = new Date().getTime() / 1000;
        let pass = 0;
        let totalScrollLen = finalScroll - initScroll;

        return new Promise((resolve, reject) => {
            this.moving = true;
            let tick = () => {
                pass = new Date().getTime() / 1000 - start;

                if (pass < t) {
                    this.scroll = this._moveTo(initScroll + easing[easingName](pass / t) * totalScrollLen);
                    this.moveT = requestAnimationFrame(tick);
                } else {
                    resolve();
                    this._stop();
                    this.scroll = this._moveTo(initScroll + totalScrollLen);
                }
            };
            tick();
        });
    }

    _stop() {
        this.moving = false;
        cancelAnimationFrame(this.moveT);
    }

    _selectByScroll(scroll) {
        scroll = Math.max(0, Math.min(scroll, this.source.length - 1));

        if (isNaN(scroll) || scroll < 0 || scroll >= this.source.length) {
            console.error('Invalid scroll value:', scroll);
            return;
        }

        this._moveTo(scroll);
        this.scroll = scroll;
        this.selected = this.source[scroll];
        this.value = this.selected.value;
        this.onChange && this.onChange(this.selected);

        const event = new CustomEvent('breakSelected', { detail: this.selected });
        this.elems.el.dispatchEvent(event);
    }

    updateSource(source) {
        this._create(source);

        if (!this.moving) {
            this._selectByScroll(this.scroll);
        }
    }

    select(value) {
        for (let i = 0; i < this.source.length; i++) {
            if (this.source[i].value === value) {
                window.cancelAnimationFrame(this.moveT);
                let initScroll = this._normalizeScroll(this.scroll);
                let finalScroll = i;
                let t = Math.sqrt(Math.abs((finalScroll - initScroll) / this.a));
                this._animateToScroll(initScroll, finalScroll, t);
                setTimeout(() => this._selectByScroll(i));
                return;
            }
        }
        throw new Error(`Cannot select value: ${value}; ${value} matches nothing in current source.`)
    }

    destroy() {
        this._stop();
        for (let eventName in this.events) {
            this.elems.el.removeEventListener("eventName", this.events[eventName]);
        }
        document.removeEventListener("mousedown", this.events["touchstart"]);
        document.removeEventListener("mousemove", this.events["touchmove"]);
        document.removeEventListener("mouseup", this.events["touchend"]);
        this.elems.el.innerHTML = "";
        this.elems = null;
    }
}

function getBreaks() {
    return breakList.map((schoolBreak, index) => ({ value: index, text: schoolBreak }));
}

let breakSource = getBreaks();

let breakSelector = new ScrollSelector({
    el: "#break1",
    type: "normal",
    source: breakSource,
    count: 20,
    onChange: (selected) => {
        console.log(breakSelector.value);
    }
});

document.querySelector("#break1").addEventListener("wheel", function(event) {
    event.preventDefault();
    if (event.deltaY < 0) {
        breakSelector.select(breakSelector.value - 1);
    } else if (event.deltaY > 0) {
        breakSelector.select(breakSelector.value + 1);
    }
});

const countdown = document.getElementById("countdown");
const breakDates = {
    0: "2024-10-04T00:00:00",
    1: "2024-12-20T00:00:00",
    2: "2025-02-14T00:00:00",
    3: "2025-04-11T00:00:00",
    4: "2025-06-20T00:00:00"
};
let endDate = new Date(breakDates[0]).getTime();

function updateTime() {
    const now = new Date().getTime();
    const diff = endDate - now;

    if (diff <= 0) {
        countdown.innerHTML = "00:00:00:00";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdown.innerHTML = `${days.toString().padStart(2, "0")}:${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function updateEndDate(selectedBreak) {
    // Update the end date based on the selected break
    endDate = new Date(breakDates[selectedBreak.value]).getTime();
}

document.querySelector('#break1').addEventListener('breakSelected', function(event) {
    updateEndDate(event.detail);
});

setInterval(updateTime, 500);