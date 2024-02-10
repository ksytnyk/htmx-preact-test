'use strict';
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

exports.getDom = async (url) => {
  let WINDOW;

  class Worker {
    constructor(...args) {
    }

    postMessage(message) {
      console.log(message);
    }

    addEventListener() {
    }

    removeEventListener() {
    }
  }

  class CustomResourceLoader extends jsdom.ResourceLoader {
    fetch(url, options) {
      console.log(url);
      return super.fetch(url, options);
    }
  }

  const DOM2 = await JSDOM.fromURL(url, {
    resources: new CustomResourceLoader(),
    runScripts: 'dangerously',
  });

  WINDOW = DOM2.window;

  WINDOW.performance.timing = new Proxy({}, {
    get() {
      return 0;
    },
  });

  WINDOW.Worker = Worker;
  WINDOW.URL.createObjectURL = () => '';
  WINDOW.requestAnimationFrame = (h) => setTimeout(() => h(Date.now()), 1);

  DOM2.sendEvent = (event, node) => {
    var evt = WINDOW.createEvent('HTMLEvents');
    evt.initEvent(event, true, true);
    node.dispatchEvent(evt);
  };

  return DOM2;
};
