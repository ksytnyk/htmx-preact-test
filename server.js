const _ = require('lodash');
const express = require('express');
const {engine} = require('express-handlebars');
const fs = require('fs');
const handlebars = require('handlebars');


const app = express();
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));

app.get('/', H(async (req, res) => {
  res.render('index');
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
