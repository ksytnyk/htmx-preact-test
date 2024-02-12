const babel = require('@babel/core');
const fs = require('fs');
const vm = require('vm');
const _ = require('lodash');
const path = require('path');

// Babel configuration
const babelOptions = {
  presets: ['@babel/preset-react', ['@babel/preset-env', {
    modules: 'commonjs', targets: {
      node: 'current', // Or specify a specific version, e.g., '10' if you're targeting Node.js version 10
    },
  }]], // Use the React preset
  plugins: [{
    visitor: {
      JSXElement(path) {
        // Here, you can access each JSX element and construct a tree structure
        console.log('Element:', path.node.openingElement.name.name);
        // This is a simplified example. You would need to recursively build the tree structure based on the JSX elements.
      },
    },
  }],
};

exports.compile = async () => {
  let promises = [];
  fs.mkdirSync(__dirname + '/.components', {recursive: true});
  walkDir(__dirname + '/components', __dirname + '/.components', (file1, file2) => {
    const code = fs.readFileSync(file1, 'utf8');
    const p = babel.transformAsync(code, babelOptions);
    promises.push({file: file2.replace(/.jsx$/, '.js'), code: p});
  });

  for (const {file, code} of promises) {
    let code2 = await code;
    fs.writeFileSync(file, code2.code, 'utf8');
  }
};

function walkDir(dir, dir2, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath1 = path.join(dir, file);
    const filePath2 = path.join(dir2, file);
    if (fs.statSync(filePath1).isDirectory()) {
      fs.mkdirSync(filePath2, {recursive: true});
      walkDir(filePath1, filePath2, callback); // Recurse into subdirectories
    } else {
      callback(filePath1, filePath2);
    }
  });
}
