'use strict';

const debug = require('debug')('sigfox-connectedconf:server');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

/* init */
const app = express();


const atmel = require('./routes/atmel');
const tdGps = require('./routes/td-gps');
const akene = require('./routes/akene');
const sensit = require('./routes/sensit');
const logs = require('./routes/logs');

const requestLogger = require('./middlewares/requestLogger');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended:false}));
app.locals.moment = require('moment');


app.get('/', function(req, res){
  res.redirect('/atmel');
});
app.use('/atmel', atmel);
app.use('/td-gps', tdGps);
app.use('/akene', akene);
app.use('/sensit', sensit);
app.use('/logs', logs);



//404 handling
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.format({
    json:function(){
      return res.json({err:err});
    },
    html:function(){
      return res.render('error', {
        err: err
      });
    },
    default:function(){
      res.send();
    }
  });
});


module.exports = app;