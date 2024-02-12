const _ = require('lodash');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

const L = (...args) => console.log(Date.now(), ...args);

exports.createEnvironment = () => {
  const React = new Proxy(require('preact'), {
    get(target, p, receiver) {
      if (p === 'createElement') {
        return (type, props, ...children) => {
          if (props?.onChange) props['hx-post'] = '/change/element?xid=';
          return target[p](type, props, ...children);
        };
      }
      return target[p];
    },
  });

  let c = 1;
  const DOM = new JSDOM(Buffer.from('<body></body>'));
  const document = new Proxy(DOM.window.document, {
    get(target, p, receiver) {
      if (_.isFunction(target[p])) return (...args) => {
        const el = target[p](...args);
        if (p === 'createElement') {
          const xid = c++;
          el.setAttribute('xid', xid);
          setTimeout(() => {
            if (el.getAttribute('hx-post') === '/change/element?xid=') {
              el.setAttribute('hx-post', '/change/element?xid=' + xid);
              el.setAttribute('hx-swap', 'none');
            }
          });
        }
        // L('Proxy call', p, ...args);
        return el;
      };
      L('Proxy', p);
      return target[p];
    },
  });

  const changes = [];

  const selector = (v) => `[xid="${v}"]`;

  const observer = new DOM.window.MutationObserver(function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (const n of mutation.addedNodes) {
          L(mutation.type, 'added', n.outerHTML || n.data);
          const pnode = n.parentNode;
          changes.push(`<div hx-swap-oob='beforeend:${selector(pnode.getAttribute('xid'))}'>${n.outerHTML}</div>`);
        }
        for (const n of mutation.removedNodes) {
          L(mutation.type, 'removed', n.outerHTML || n.data);
          const node = n.cloneNode(true);
          node.setAttribute('hx-swap-oob', `delete:${selector(node.getAttribute('xid'))}`);
          changes.push(node.outerHTML);
        }
      }
      if (mutation.type === 'attributes') {
        L(mutation.type, 'changed', mutation.target.outerHTML || mutation.target.data);
        const node = mutation.target.cloneNode(true);
        node.setAttribute('hx-swap-oob', `outerHTML:${selector(node.getAttribute('xid'))}`);
        changes.push(node.outerHTML);
      }
      if (mutation.type === 'characterData') {
        L(mutation.type, 'changed', mutation.target.parentNode.outerHTML);
        const node = mutation.target.parentNode.cloneNode(true);
        // if (node.outerHTML !== )
        node.setAttribute('hx-swap-oob', `outerHTML:${selector(node.getAttribute('xid'))}`);
        changes.push(node.outerHTML);
      }
    }
  });

  // const Component2 = createRoot([{id: 12, task: 'test', checked: true}, {id: 13, task: 'test2', checked: false}]);
  // const Component3 = createRoot([{id: 13, task: 'test2', checked: false}]);

  const $body = document.getElementsByTagName('body')[0];
  observer.observe($body, {
    characterData: true,
    characterDataOldValue: true,
    attributes: true,
    childList: true,
    subtree: true,
  });

  global.React = React;
  const {createRoot} = require('./.components');
  const Component = createRoot();

  return {
    emitChange: async (id, req) => {
      const $el = document.querySelector(selector(id));
      const clickEvent = new DOM.window.Event('change');
      clickEvent.req = req;
      $el.dispatchEvent(clickEvent);
      changes.splice(0, 99999);
      while (changes.length < 1) {
        await new Promise(r => setTimeout(r, 20));
      }
      await new Promise(r => setTimeout(r, 20));

      return changes;
    },

    renderHtml: async () => {
      const old = {
        window: global.window,
        document: global.document,
      };
      global.window = DOM.window;
      global.document = document;

      React.render(Component, $body);
      await new Promise(r => setTimeout(r, 20));
      // _.extend(global, old);

      return $body.innerHTML;
    },
  };
};
//
// exports.emitChange = (id) => {
//
// };
//
// // Babel configuration
// const babelOptions = {
//   presets: ['@babel/preset-react', ['@babel/preset-env', {
//     modules: 'commonjs', targets: {
//       node: 'current', // Or specify a specific version, e.g., '10' if you're targeting Node.js version 10
//     },
//   }]], // Use the React preset
//   plugins: [{
//     visitor: {
//       JSXElement(path) {
//         // Here, you can access each JSX element and construct a tree structure
//         L('Element:', path.node.openingElement.name.name);
//         // This is a simplified example. You would need to recursively build the tree structure based on the JSX elements.
//       },
//     },
//   }],
// };
//
// async function main() {
//   let promises = [];
//   fs.mkdirSync(__dirname + '/.components', {recursive: true});
//   walkDir(__dirname + '/components', __dirname + '/.components', (file1, file2) => {
//     const code = fs.readFileSync(file1, 'utf8');
//     const p = babel.transformAsync(code, babelOptions);
//     promises.push({file: file2.replace(/.jsx$/, '.js'), code: p});
//   });
//
//   for (const {file, code} of promises) {
//     let code2 = await code;
//     fs.writeFileSync(file, code2.code, 'utf8');
//   }
//
//   const renderToString = require('preact-render-to-string');
//   const React = new Proxy(require('preact'), {
//     get(target, p, receiver) {
//       if (p === 'createElement') {
//         return (type, props, ...children) => {
//           if (props?.onChange) props['hx-post'] = '/change/element?xid=';
//           return target[p](type, props, ...children);
//         };
//       }
//       return target[p];
//     },
//   });
//   const jsdom = require('jsdom');
//   const {JSDOM} = jsdom;
//
//   let c = 1;
//   const DOM = new JSDOM(Buffer.from('<body></body>'));
//   DOM.window.document = new Proxy(DOM.window.document, {
//     get(target, p, receiver) {
//       if (_.isFunction(target[p])) return (...args) => {
//         const el = target[p](...args);
//         if (p === 'createElement') {
//           const xid = c++;
//           el.setAttribute('xid', xid);
//           setTimeout(() => {
//             if (el.getAttribute('hx-post') === '/change/element?xid=') {
//               el.setAttribute('hx-post', '/change/element?xid=' + xid);
//             }
//           });
//         }
//         // L('Proxy call', p, ...args);
//         return el;
//       };
//       L('Proxy', p);
//       return target[p];
//     },
//   });
//
//   const observer = new DOM.window.MutationObserver(function (mutationsList, observer) {
//     for (const mutation of mutationsList) {
//       if (mutation.type === 'childList') {
//         for (const n of mutation.addedNodes) {
//           L(mutation.type, 'added', n.outerHTML || n.data);
//         }
//         for (const n of mutation.removedNodes) {
//           L(mutation.type, 'removed', n.outerHTML || n.data);
//         }
//       }
//       if (mutation.type === 'attributes') {
//         L(mutation.type, 'changed', mutation.target.outerHTML || mutation.target.data);
//       }
//       if (mutation.type === 'characterData') {
//         L(mutation.type, 'changed', mutation.target.parentNode.outerHTML);
//       }
//     }
//   });
//
//   // const Component2 = createRoot([{id: 12, task: 'test', checked: true}, {id: 13, task: 'test2', checked: false}]);
//   // const Component3 = createRoot([{id: 13, task: 'test2', checked: false}]);
//
//   const $body = DOM.window.document.getElementsByTagName('body')[0];
//
//   const {createRoot} = require('./.components');
//   const Component1 = createRoot([{id: 12, task: 'test', checked: true}]);
//   React.render(Component1, document.getElementsByTagName('body')[0]);
//
//   observer.observe($body, {characterData: true, attributes: true, childList: true, subtree: true});
//   const html1 = $body.innerHTML;
//
//
//   await new Promise(e => setTimeout(e, 500));
//
//   function click($el) {
//     const clickEvent = new DOM.window.Event('change');
//     $el.dispatchEvent(clickEvent);
//   }
//
//   const $clickMe = DOM.window.document.getElementById('click-me');
//   click($clickMe);
//   await new Promise(e => setTimeout(e, 500));
//   click($clickMe);
//   await new Promise(e => setTimeout(e, 500));
//   click($clickMe);
//
//
//   await new Promise(e => setTimeout(e, 500));
//   debugger;
//   //
//   // React.render(Component2, $body);
//   // await new Promise(e => setTimeout(e, 1000));
//   // const html2 = $body.innerHTML;
//   // React.render(Component3, $body);
//   // const html3 = $body.innerHTML;
//   // await new Promise(e => setTimeout(e, 1000));
//   //
//   // const html = renderToString(Component1);
// // Transform the JSX code
// }
//
//
// function walkDir(dir, dir2, callback) {
//   fs.readdirSync(dir).forEach(file => {
//     const filePath1 = path.join(dir, file);
//     const filePath2 = path.join(dir2, file);
//     if (fs.statSync(filePath1).isDirectory()) {
//       fs.mkdirSync(filePath2, {recursive: true});
//       walkDir(filePath1, filePath2, callback); // Recurse into subdirectories
//     } else {
//       callback(filePath1, filePath2);
//     }
//   });
// }
//
// main();