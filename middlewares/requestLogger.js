'use strict';
const debug = require('debug')('sigfox-connectedconf:request-logger');
const db = require('../modules/db');
module.exports = function(req, res, next){
  db.insertOne('request_logs', {date:new Date().toISOString(), method:req.method, path:req.baseUrl, data:req.body || req.query})
  .then(function(obj){
    debug('Request log OK');
    next();
  })
  .catch(function(err){
    debug('Log err : %s', err);
    return res.status(500).json({err:'Unable to log request', details:err.message});
  });
};