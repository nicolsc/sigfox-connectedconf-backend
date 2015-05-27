'use strict';

const express = require('express');
const router = express.Router();
const requestLogger = require('../middlewares/requestLogger');
const db = require('../modules/db');
const debug = require('debug')('sigfox-connectedconf:td-gps');

router.post('/', requestLogger, function(req, res, next){
  if (!req.body || !req.body.data){
    debug("body");debug(req.body);
    let err = new Error();
    err.status = 400;
    err.message = 'Invalid data';
    return next(err);
  }
  const coords = getGPSCoords(req.body.data);
  debug("coords", coords);
  const validCoords = coords && typeof coords.lat !== 'undefined' && typeof coords.lng !== 'undefined';
  //4750532054494d454f5554 == GPS TIMEOUT
  let data = {
    deviceid: req.body.id,
    date : new Date(req.body.time * 1000).toISOString(),
    receivedat: new Date().toISOString(),
    snr : req.body.snr,
    geoloc : validCoords, 
    payload : req.body.data,
    lat: coords.lat, 
    lng: coords.lng
  };
  debug("data", data);
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
router.get('/', function(req, res, next){
  let qry = 'select deviceid, date, receivedat, geoloc, lat, lng, snr, payload from td1204_gps_demo order by date desc';
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

/**
* @function
* Get GPS Coords from an hex frame
* @param {String} hex frame
* @return {Object} lat:float, lng:float
**/
function getGPSCoords(payload){
  debug('getGPSCOords', payload);
  if (!payload){
    debug('Empty payload');
    
    return null;
  }
  const data = getFrameComposition(payload);
  if (!data){
    debug('Invalid GPS  frame - %s', payload);
    return null;
  }
  
  if (!data.geoloc || !validationCheck(data)){
    debug('No geoloc data (%s)', data.geoloc);
    return null;
  }
  return _getLatLng(data.latlng, data.latsign, data.lngsign);
}
/**
* @function
* Get the composition of a TD GPS frame
* @param {string} frame in hexa
* @return {Object} geoloc, latlng, lngsign, latsign
**/
function getFrameComposition(frameHex){
  debug('getFrameComposition', frameHex);
  let frame =  getFramePattern().exec(getFrameBinary(frameHex));
  if (!frame){
    debug('Frame doesn\'t match expected pattern : %s',frameHex);
    return null;
  }
  
  return {
    geoloc : frame[2],
    latlng : frame[4],
    lngsign : frame[6],
    latsign : frame[7]
  };
}
/**
* @function
* Get the binary string of an hex frame
* @param {String} frame in hex
* @return {String} frame in binary
**/
function getFrameBinary(frameHex){
  debug('getFrameBinary', frameHex);
  const bytes = frameHex.match(/.{1,2}/g);
  if (bytes.length !== 12){
    debug('Invalid frame, got %s bytes', bytes.length);
    return null;
  }
  let binaryString='';
  bytes.forEach(function(byte){
    binaryString += getBinaryFromHex(byte);
  });
  if (!binaryString.match(/^([0-9]*)$/)){
    debug('Unable to parse frame %s : %s', frameHex, binaryString);
    return null;
  }
  return binaryString;
  
}
/**
* @function
* Get binary value of an hex byte
* @param {String} byte
* @return {String} binary
**/
function getBinaryFromHex(byte){
  debug('getBinaryFromHex', byte);
  let num = Number(parseInt(byte, 16));
  if (isNaN(num)){
    debug('Invalid byte %s', byte);
    return null;
  }
  let binary = num.toString(2);
  
  //Fill the byte with zeros
  while (binary.length < 8){
    binary ='0'+binary;
  }
  
  return binary;
}

/**
* @function
* Get lat/lng values from the 48bit section of the frame + the 2 bits re: +/-
* Variables:
* var_0: [Long] (#latlng % 10000000) / 100000
* var_1: [Double] (#latlng % 100000) / 1000d / 60d
* var_2: [Long] #latlng / 1000000000000L
* var_3: [Double] (#latlng % 1000000000000L - #latlng % 10000000) / 10000000d / 1000d / 60d
* Latitude definition: (#var_0 + #var_1) * (#latsign == 0 ? 1 : -1)
* Longitude definition: (#var_2 + #var_3) * (#lngsign == 0 ? 1 : -1)
* @param {String} latLng in binary
* @param {int} latSign +1 or -1
* @param {int} lngSign +1 or -1
*@return {Object} lat:float, lng:float
**/
function _getLatLng(latLng2, latSign, lngSign){
  debug('_getLatLng', latLng2);
  const latLng10 = parseInt(latLng2, 2) ;

  const var0 = parseInt((latLng10  % 10000000) / 100000, 10);
  const var1 = (latLng10 % 100000) / 1000/ 60 ;
  const var2 = parseInt(latLng10 / 1000000000000, 10);
  const var3 = parseInt((latLng10 % 1000000000000 - latLng10 % 10000000) / 10000000, 10) / 1000 / 60;
  
  return {
    lat: (var0 + var1) * (latSign === '0' ? 1 : -1),
    lng: (var2 + var3) * (lngSign === '0' ? 1 : -1)
  };
}
/**
* @function
* Checks that frame contains gps position, using the geoloc part
* @param {String} frame in binary
* @return {bool} valid gps position
**/
function validationCheck(frame){
   return parseInt(frame.geoloc,2) === 0x101;
}
/**
* @function
* Get frame composition pattern
* @return {RegExp}
**/
function getFramePattern(){
  return /(.{12})(.{12})(.{4})(.{48})(.{12})(.)(.)/;
}

module.exports = router;