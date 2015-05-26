'use strict';

const express = require('express');
const router = express.Router();
const requestLogger = require('../middlewares/requestLogger');
const db = require('../modules/db');
const debug = require('debug')('sigfox-connectedconf:logs');

router.get('/', function(req, res, next){
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


module.exports = router;