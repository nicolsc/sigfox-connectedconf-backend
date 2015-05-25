'use strict';
require('./loadConfig');

const debug = require('debug')('sigfox-demo-td1204:init.sql');
const pg = require('./modules/db');
const fs = require('fs');

debug('Postinstall');
pg.connect()
.then(function(db){
  debug('db connection OK');
  
  const initSQL = fs.readFileSync('./sql/init.sql', {encoding:'utf-8'});
  debug(initSQL);
  db.query(initSQL)
  .then(function(data){
    debug('\u001b[32m♡\u001b[49m');
    debug(data);
    process.exit(0);
  })
  .catch(function(err){
   debug('An error occured while initalizing the DB : \n %s', err); 
   process.exit(1);  
  });
  
})
.catch(function(err){
  debug('Unable to connect to %s', err);
  throw err;
});