'use strict';

var Bittrex = require('./integrations/Bittrex');
var Poloniex = require('./integrations/Poloniex');

module.exports = {
  'bittrex': Bittrex,
  'poloniex': Poloniex
};