'use strict';
const util = require('util');
const debug = require('debug')('sigfox-connectedconf:db');
const pg = require('pg-promise');
const format = require('util').format;
const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/sigfox';


module.exports = {
  db : undefined,
  pgError: function(err, details){
    debug("PostgreSQL error : %s", err ? err.message : 'unknown');
    if (details.cn) {
        // this is a connection-related error;
        // cn = connection details that were used.
      debug('Connection error');
    }
    if (details.query) {
        debug('Query error : %s', details.query);
        if (details.params) {
            debug("Parameters: %s", details.params);
        }
    }
    if (details.ctx) {
        debug('transaction err : %s', details.ctx);
    }
  },
  pgDisconnect: function(client){
    var cp = client.connectionParameters;
    debug("Disconnecting from database %s", cp.database);
  },
  /**
  * Connect to the DB, using pg-promise 
  * @function
  * @return {Promise}
  **/
  connect : function() {
    
    
    return new Promise(function(resolve, reject){
      pg({
        disconnect: this.pgDisconnect,
        error: this.pgError
      })(dbUrl).connect()
      .then(function(db){
        this.db = db;
        resolve(db);
      }.bind(this))
      .catch(function(err){
        debug('Error connecting to the DB : %s', err.message);
        reject(err);
      });
    }.bind(this));
  },
  /**
  * Insert a new row in a table
  * @function
  * @param {String} tableName
  * @param {Object} data. Keys/Pairs, as key=val
  * @return {Promise}
  **/
  insertOne: function(tableName, data){
    debug('Insert %o in %s', data, tableName);
    const statementItems = this.getInsertStatement(tableName, data);
    debug('SQL : %s', statementItems[0]);
    return this.db.one(statementItems[0], statementItems[1]);
  },
  /**
  * Craft the insert into {table} (keys...) values (values..) string
  * @function
  * @param {String} tableName
  * @param {Object} data in key/value pairs
  * @return {String}
  **/
  getInsertStatement: function(tableName, data){
    const keys = Object.keys(data);
    let indexes = keys.map(function(key, idx){
      return '$'+(idx+1);
    });
    
    let values = keys.map(function(key){
      return data[key];
    }.bind(this));
    return [util.format('insert into %s (%s) values (%s) returning *', tableName, keys.join(','), indexes.join(',')), values];
  }
};