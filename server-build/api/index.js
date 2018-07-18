'use strict';

var express = require('express');
var router = express.Router();

var _require = require('../integrations/Exchange'),
    Exchange = _require.Exchange;

var exchanges = require('../exchanges');
var ExchangeAggregator = require('../integrations/ExchangeAggregator');
var asyncMiddleware = require('../utils/asyncResolve');

router.get('/getMarkets', asyncMiddleware(function _callee2(req, res, next) {
  var exchangeStrings, promisedExchanges;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          exchangeStrings = Object.keys(exchanges);

          console.log("Trying home");

          promisedExchanges = exchangeStrings.map(function _callee(exch) {
            var exchange;
            return regeneratorRuntime.async(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    exchange = new exchanges[exch]();
                    _context.next = 3;
                    return regeneratorRuntime.awrap(exchange.getMarket());

                  case 3:
                    return _context.abrupt('return', _context.sent);

                  case 4:
                  case 'end':
                    return _context.stop();
                }
              }
            }, null, undefined);
          });

          Promise.all(promisedExchanges).then(function (markets) {
            var market1 = markets.filter(function (mkt) {
              return mkt[0].hasOwnProperty('logo');
            })[0];
            // Will  need to rework this if more than 2 exchanges
            var market2 = markets.filter(function (mkt) {
              return !mkt[0].hasOwnProperty('logo');
            })[0];

            var sharedMarkets = market1.filter(function (val1) {
              return market2.some(function (val2) {
                return val1.market === val2.market;
              });
            });

            res.json(sharedMarkets);
          });

        case 4:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined);
}));

module.exports = router;