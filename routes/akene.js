'use strict';

const express = require('express');
const router = express.Router();
const requestLogger = require('../middlewares/requestLogger');
const db = require('../modules/db');
const debug = require('debug')('sigfox-connectedconf:akene');

router.post('/', requestLogger, function(req, res, next){
  debug('POST /akene');
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
  debug(req.body.data);
  //frame pattern : Counter{1 byte}
  const pattern = /(.{1,2})/;
  const frame = req.body.data.match(pattern);
  debug('frame %s', frame);
  const data = {
    deviceid: req.body.id,
    date : new Date(req.body.time * 1000).toISOString(),
    receivedat: new Date().toISOString(),
    snr : req.body.snr,
    counter: parseInt(frame[0], 16),
    payload : req.body.data
  };
  debug('data', data);
  db.insertOne('akene_demo', data)
  .then(function(entry){
    debug('Message stored in db');
    /*
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
    });*/
  })
  .catch(function(err){
    debug('Error while logging akene demo data : %s', err.message);
    //next(err);
  });
});
router.get('/', function(req, res, next){
  let qry = 'select deviceid, date, receivedat,counter, snr, payload from akene_demo order by date desc';
  debug(qry);
  db.db.query(qry)
  .then(function(entries){
    res.format({
      json: function(){
        res.json(entries);
      },
      html: function(){
        res.render('akene-demo', {title:"Akene demo", h1: "Logs" , entries:entries});
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