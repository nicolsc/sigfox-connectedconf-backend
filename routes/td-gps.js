'use strict';

const express = require('express');
const router = express.Router();
const requestLogger = require('../middlewares/requestLogger');
const db = require('../modules/db');
const debug = require('debug')('sigfox-connectedconf:td-gps');

router.post('/', requestLogger, function(req, res, next){
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
router.get('/', requestLogger, function(req, res, next){
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

module.exports = router;