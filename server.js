const _ = require('lodash');
const express = require('express');
const {engine} = require('express-handlebars');
const fs = require('fs');
const Handlebars = require('handlebars');

require('./bable-test').compile();

const env = require('./preact');


const app = express();
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

app.use(express.json({limit: '10MB'}));
app.use(express.urlencoded({extended: false, limit: '10MB'}));
app.use('/public', express.static(__dirname + '/public'));
app.use((req, res, next) => (res.renderString = render.bind(null, res), next()));
app.use((req, res, next) => {
  const cookies = req.headers.cookie.split(';');
  const cookieMap = {};
  for (const c of cookies) {
    const [key, value] = c.split('=');
    cookieMap[key.trim()] = value.trim();
  }
  req.cookieMap = cookieMap;
  next();
});


const ENVS = {};

app.get('/', H(async (req, res) => {
  const sessionId = req.cookieMap['session-id'] || Math.random().toString(36) + Math.random().toString(36);
  if (!ENVS[sessionId]) {
    ENVS[sessionId] = env.createEnvironment();
  }
  const html = await ENVS[sessionId].renderHtml();
  res.cookie('session-id', sessionId, {maxAge: 900000, httpOnly: true});
  res.render('components', {html});
}));

app.post('/change/element', H(async (req, res) => {
  const sessionId = req.cookieMap['session-id'];
  if (!ENVS[sessionId]) {
    throw new Error('Env is not created');
  }
  const changes = await ENVS[sessionId].emitChange(req.query.xid, req);
  const html = changes.join('\n');
  res.render('components', {html, layout: null});
}));
let count = 0;

app.post('/count', H(async (req, res) => {
  count++;
  await new Promise((r) => setTimeout(r, 500));
  res.render('elements', {layout: null, data: {count, tempCounter: true}});
}));

const todoListState = {};

const todoRouter = express.Router();
app.use('/todo', todoRouter);

todoRouter.get('/list', H(async (req, res) => {
  res.render('elements', {layout: null, data: {list: todoListState.list || [], tempTodoList: true}});
}));

let id = 1;

todoRouter.post('/action', H(async (req, res) => {
  if (req.query.add) {
    todoListState.list = todoListState.list || [];
    const e = {checked: false, task: req.body.task, id: id++};
    todoListState.list.push(e);
    res.render('elements', {
      layout: null,
      data: {element: e, list: todoListState.list, tempTodoElement: true, tempTodoListCounter: true},
    });
    return;
  }
  if (req.query.remove) {
    todoListState.list = _.filter(todoListState.list, (t) => t.id !== Number(req.query.id));
  }
  if (req.query.check) {
    todoListState.list = todoListState.list || [];
    const e = _.find(todoListState.list, {id: Number(req.query.id)});
    e.checked = !e.checked;
    res.render('elements', {
      layout: null,
      data: {element: e, list: todoListState.list, tempTodoElement: true, tempTodoListCounter: true},
    });
    return;
  }
  res.render('elements', {layout: null, data: {list: todoListState.list, tempTodoListCounter: true}});
}));


if (!global._TEST) {
  const PORT = process.env.PORT || 37482;
  app.listen(PORT, () => console.log('Listen', PORT));
}

module.exports = app;

function H(h) {
  return async (req, res, next) => {
    try {
      await Promise.resolve().then(() => h(req, res, next));
    } catch (e) {
      console.error(e);
      res.status(500).send({error: e.message});
    }
  };
}


function render(res, templateString, data) {
  const template = Handlebars.compile(templateString);
  res.setHeader('content-type', 'text/html');
  res.send(template(data));
}
