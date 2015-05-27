'use strict';

const express = require('express');
const router = express.Router();
const requestLogger = require('../middlewares/requestLogger');
const db = require('../modules/db');
const debug = require('debug')('sigfox-connectedconf:sensit');

router.post('/', requestLogger, function(req, res, next){
  if (!req.body){
     let err = new Error();
    err.status = 400;
    err.message = 'Invalid data';
    return next(err);
  }
  res.status(501);
  res.format({
    json: function(){
      res.json({'message':'Coming soon ☺'});
    },
    html: function(){
      res.send('Coming Soon ☺');
    },
    default: function(){
      let err = new Error('Invalid Accept header. This method only handles html & json');
      err.status=406;
      next(err);
    }
  });
});
router.get('/', function(req, res, next){
  res.format({
    json: function(){
      res.json(null);
    },
    html: function(){
      res.render('sensit-demo', {title:"Sensit demo", h1: "Coming soon" , entries:null});
    },
    default:function(){
        let err = new Error('Invalid Accept header. This method only handles html & json');
        err.status=406;
        next(err);
      }
  });
  
});

module.exports = router;