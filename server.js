'use strict';
require('./loadConfig');

const debug = require('debug')('sigfox-demo-td1204:app');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');

/* init */
const app = express();
const port = process.env.PORT || 34002;
const server = http.createServer(app);
const db = require('./modules/db');

const requestLogger = require('./middlewares/requestLogger');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended:false}));
app.locals.moment = require('moment');



db.connect()
.then(function(){
  server.listen(port);
})
.catch(function(err){
  debug('Unable to connect to DB');
  debug(err);
  process.exit(1);
});
app.get('/', function(req, res, next){
 res.send(':)');
});
app.post('/', requestLogger, function(req, res, next){
  if (!req.body || !req.body.sensors || !req.body.sensors.length){
    let err = new Error();
    err.status = 400;
    err.message = 'Invalid data';
    return next(err);
  }
  res.json({result:'♡'});
});
app.post('/gps-demo', requestLogger, function(req, res, next){
  if (!req.body){
     let err = new Error();
    err.status = 400;
    err.message = 'Invalid data';
    return next(err);
  }
  let data = {
    deviceid: req.body.id,
    date : new Date(req.body.time * 1000).toISOString(),
    receivedat: new Date().toISOString(),
    snr : req.body.snr,
    geoloc : req.body.data !== "4750532054494d454f5554", //4750532054494d454f5554 == GPS TIMEOUT
    payload : req.body.data,
    coords: null //point (lat,lng). Wait for info to decode frame
  };
  
  db.insertOne('td1204_gps_demo', data)
  .then(function(entry){
    res.status(201);
    res.format({
      json: function(){
        res.json(entry);
      },
      html: function(){
        res.send(entry);
      },
      default: function(){
        let err = new Error('Invalid Accept header. This method only handles html & json');
        err.status=406;
        next(err);
      }
    });
  })
  .catch(function(err){
    debug('Error while logging movement report : %s', err.message);
    next(err);
  });
});
app.get('/gps-demo', requestLogger, function(req, res, next){
  let qry = 'select deviceid, date, receivedat, geoloc, coords[0] lat, coords[1] lng, snr, payload from td1204_gps_demo order by date desc';
  debug(qry);
  db.db.query(qry)
  .then(function(entries){
    res.format({
      json: function(){
        res.json(entries);
      },
      html: function(){
        res.render('gps-demo', {title:"TD1204 demo", h1: "Movements detected" , entries:entries});
      },
      default:function(){
          let err = new Error('Invalid Accept header. This method only handles html & json');
          err.status=406;
          next(err);
        }
    });
  })
  .catch(next);
  
});

app.post('/atmel', requestLogger, function(req, res, next){
  if (!req.body){
     let err = new Error();
    err.status = 400;
    err.message = 'Invalid data';
    return next(err);
  }
  //frame pattern : Temp(1 byte)Brightness(2 bytes)
  const pattern = /(.{1,2})(.{1,4})/;
  const frame = req.body.data.match(pattern);
  const data = {
    deviceid: req.body.id,
    date : new Date(req.body.time * 1000).toISOString(),
    receivedat: new Date().toISOString(),
    snr : req.body.snr,
    temperature : frame && frame.length && frame.length===3  ? parseInt(frame[1],16) : null,
    brightness : frame && frame.length && frame.length===3  ? parseInt(frame[2],16) : null,
    payload : req.body.data
  };
  
  db.insertOne('atmel_demo', data)
  .then(function(entry){
    res.status(201);
    res.format({
      json: function(){
        res.json(entry);
      },
      html: function(){
        res.send(entry);
      },
      default: function(){
        let err = new Error('Invalid Accept header. This method only handles html & json');
        err.status=406;
        next(err);
      }
    });
  })
  .catch(function(err){
    debug('Error while logging atmel demo data : %s', err.message);
    next(err);
  });
});
app.get('/atmel', requestLogger, function(req, res, next){
  let qry = 'select deviceid, date, receivedat,temperature, brightness, snr, payload from atmel_demo order by date desc';
  debug(qry);
  db.db.query(qry)
  .then(function(entries){
    res.format({
      json: function(){
        res.json(entries);
      },
      html: function(){
        res.render('atmel-demo', {title:"Atmel demo", h1: "Data received" , entries:entries});
      },
      default:function(){
          let err = new Error('Invalid Accept header. This method only handles html & json');
          err.status=406;
          next(err);
        }
    });
  })
  .catch(next);
  
});
app.get('/logs', function(req, res, next){
  db.db.query('select * from request_logs order by date desc')
  .then(function(entries){
     res.format({
        /* JSON first */
        json: function(){
            res.json(entries);
        },
        html: function(){
            res.render('logs', {title:'Request logs', entries:entries});        
        },
        default:function(){
          let err = new Error('Invalid Accept header. This method only handles html & json');
          err.status=406;
          next(err);
        }
      });
  })
  .catch(next);
});

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

server.on('error', function(err){
    debug('ERROR %s', err);
});
server.on('listening', function(){
 debug('Server listening on port %s', port); 
});