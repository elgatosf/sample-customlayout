/// <reference path="libs/js/stream-deck.js" />
/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/utils.js" />

/**
 * This example shows how to create a custom layout for Stream Deck.
 * In it's manifest it sets the relative path to the custom layout file (layouts/customlayout.json)
 * In the customlayout.json a custom layout with 3 bars, 3 rectangles and an svg-icon is defined.
 * In the manifest.json 'Keypad' is removed from the list of supported controllers (that means
 * the action will only be shown in the Stream Deck app under the 'Dials' tab).
 */

// Action Cache
const MACTIONS = {};
// Utilities
const cycle = (idx, min, max) => (idx > max ? min : idx < min ? max : idx);
const randomColor = () => '#' + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, 0);
const debounce = (func, wait = 100) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
};

// Action Events
const sampleCustomlayoutAction = new Action('com.elgato.sample-customlayout.action');

sampleCustomlayoutAction.onWillAppear(({context, payload}) => {
    // console.log('will appear', context, payload);
    MACTIONS[context] = new SampleAction(context, payload);
});

sampleCustomlayoutAction.onWillDisappear(({context}) => {
    // console.log('will disappear', context);
    MACTIONS[context].interval && clearInterval(MACTIONS[context].interval);
    delete MACTIONS[context];
});

sampleCustomlayoutAction.onTitleParametersDidChange(({context, payload}) => {
    // console.log('wonTitleParametersDidChange', context, payload);
    MACTIONS[context].color = payload.titleParameters.titleColor;
});

sampleCustomlayoutAction.onDialPress(({context, payload}) => {
    // console.log('dial was pressed', context, payload);
    if(payload.pressed === false) {

    }
});

sampleCustomlayoutAction.onDialRotate(({context, payload}) => {
    // console.log('dial was rotated', context, payload.ticks);
    if(payload.hasOwnProperty('ticks')) {
        MACTIONS[context].dialRotate(payload.ticks);
    }
});

sampleCustomlayoutAction.onTouchTap(({context, payload}) => {
    // console.log('touchpanel was tapped', context, payload);
    if(payload.hold === false) {
        MACTIONS[context].touchTap();
    }
});

class SampleAction {
    constructor (context, payload) {
        this.context = context;
        this.interval = null;
        this.manualValue = -1;
        this.isInteracting = false;
        this.counter = 0;
        this.color = randomColor();
        this.debouncedClearInteraction = debounce(this.clearRotation.bind(this), 500);
        this.init();
        this.update();
    }

    init() {
        this.interval = setInterval(() => {
            this.update();
        }, 1000);
    }

    clearRotation() {
        this.isInteracting = false;
    }

    dialRotate(ticks, inTitle='Dial rotating') {
        this.isInteracting = true;
        this.manualValue = cycle(this.manualValue + ticks, 0, 100);
        const payload = {
            title: `${inTitle} : ${this.manualValue}`,
            bar0: {
                value: this.manualValue
            },
        };
        if(this.manualValue % 2 === 0) {
            this.shuffle(payload, this.manualValue);
        }
        $SD.setFeedback(this.context, payload);
        this.debouncedClearInteraction();
    }

    touchTap() {
        this.manualValue = Math.floor(Math.random() * 100);
        this.counter = Math.floor(Math.random() * (70 - 1 + 1) + 1);
        this.color = randomColor();
        this.dialRotate(0, 'TouchTap');
    }


    update() {
        const seconds = new Date().getSeconds();
        const indicatorValue = Math.floor(100 / 60 * seconds);
        const payload = {
            bar1: {
                value: indicatorValue
            },
            bar2: {
                value: 100 - indicatorValue
            }
        };
        this.counter = cycle(this.counter + 1, 1, 70);
        if(this.counter === 1) {
            this.color = randomColor();
        }
        const svg = this.makeSVG();
        const icon = `data:image/svg+xml;,${svg}`;
        if(!this.isInteracting) {
            payload.title = 'Hello';
            this.shuffle(payload, seconds);
        };
        payload.midrect = {
            "value": icon,
        };

        $SD.setFeedback(this.context, payload);
    }

    // set some random colors for the rectangles
    shuffle(payload, num) {
        if(num % 2 === 0) {
            payload.redrect = {
                "background": "#FF3300",
            };
        } else {
            payload.redrect = {
                "background": "#330000",
            };
        }
        if(num % 3 === 0) {
            payload.greenrect = {
                "background": "#003300",
            };
        } else {
            payload.greenrect = {
                "background": "#33BB00",
            };
        }
        if(num % 5 === 0) {
            payload.yellowrect = {
                "background": "#331100",
            };
        } else {
            payload.yellowrect = {
                "background": randomColor()
            };
        }
    }

    makeSVG() {
        return `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="70" viewBox="0 0 12 70">
           <rect x="0" y="${this.counter}" width="12" height="${70 - this.counter}" fill="${this.color}" />
        </svg>`;
    }
};



