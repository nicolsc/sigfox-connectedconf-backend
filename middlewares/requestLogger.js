'use strict';
const debug = require('debug')('sigfox-demo-TD1204:request-logger');
const db = require('../modules/db');
module.exports = function(req, res, next){
  db.insertOne('request_logs', {date:new Date().toISOString(), method:req.method, path:req.path, data:req.body || req.query})
  .then(function(obj){
    debug('Request log OK');
    debug(req.body)
    debug(obj);
    next();
  })
  .catch(function(err){
    debug('Log err : %s', err);
    return res.status(500).json({err:'Unable to log request', details:err.message});
  });
};