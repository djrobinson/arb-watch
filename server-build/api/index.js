'use strict';

var express = require('express');
var router = express.Router();

var _require = require('../integrations/Exchange'),
    Exchange = _require.Exchange;

var ExchangeAggregator = require('../integrations/ExchangeAggregator');
var asyncMiddleware = require('../utils/asyncMiddleware');

router.get('/getMarkets/:exchange', asyncMiddleware(function _callee(req, res, next) {
  var exchange;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log("Trying home");
          exchange = new Exchange(req.params.exchange);
          _context.t0 = res;
          _context.next = 5;
          return regeneratorRuntime.awrap(exchange.getMarkets());

        case 5:
          _context.t1 = _context.sent;

          _context.t0.json.call(_context.t0, _context.t1);

        case 7:
        case 'end':
          return _context.stop();
      }
    }
  }, null, this);
}));

router.get('/test', function (req, res, next) {
  console.log("Trying home");
  var requestedExchanges = ['poloniex', 'bittrex'];
  var exchangeAggregator = new ExchangeAggregator(requestedExchanges);
  exchangeAggregator.subscribeToOrderBooks();
  res.json({ test: "test" });
});

module.exports = router;