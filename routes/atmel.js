'use strict';

const express = require('express');
const router = express.Router();
const requestLogger = require('../middlewares/requestLogger');
const db = require('../modules/db');
const debug = require('debug')('sigfox-connectedconf:atmel');

router.post('/', requestLogger, function(req, res, next){
  if (!req.body || !req.body.data){
     let err = new Error();
    err.status = 400;
    err.message = 'Invalid data';
    return next(err);
  }
  else{
    //Tell the SIGFOX backend that callback reception was OK
    res.status(200);
    res.send('♡');
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
    debug('Message saved to db');
    /*res.status(201);
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
    });*/
  })
  .catch(function(err){
    debug('Error while logging atmel demo data : %s', err.message);
    //next(err);
  });
});
router.get('/', function(req, res, next){
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

module.exports = router;