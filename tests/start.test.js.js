const {getDom} = require('./dom');

let result = null;

describe('start', () => {
  it('index', async () => {
    result = await getDom('http://localhost:37482/');
    result.window.document.getElementsByTagName('BODY');
    debugger;
  });
});